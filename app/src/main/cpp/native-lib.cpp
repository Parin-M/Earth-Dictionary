#include <jni.h>
#include <android/log.h>
#include <algorithm>
#include <cmath>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include "llama.h"

#define LOG_TAG "EarthNLLB"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace {
std::mutex g_mutex;
llama_model * g_model = nullptr;
std::unordered_map<std::string, llama_token> g_languages;

std::string jstring_to_string(JNIEnv * env, jstring value) {
    if (!value) return {};
    const char *chars = env->GetStringUTFChars(value, nullptr);
    std::string result = chars ? chars : "";
    if (chars) env->ReleaseStringUTFChars(value, chars);
    return result;
}

void free_model_locked() {
    if (g_model) {
        llama_model_free(g_model);
        g_model = nullptr;
    }
    g_languages.clear();
}

bool build_language_index_locked() {
    const llama_vocab *vocab = llama_model_get_vocab(g_model);
    if (!vocab) return false;

    const int32_t n_vocab = llama_vocab_n_tokens(vocab);
    g_languages.reserve(220);
    for (int32_t i = 0; i < n_vocab; ++i) {
        const char *text = llama_vocab_get_text(vocab, i);
        if (!text) continue;
        std::string token(text);
        if (token.size() == 8 && token[3] == '_' && token[4] != '\0') {
            g_languages.emplace(std::move(token), static_cast<llama_token>(i));
        }
    }
    return true;
}

bool init_model_locked(const std::string &path) {
    if (g_model) return true;

    llama_log_set([](enum ggml_log_level level, const char *text, void *) {
        if (level >= GGML_LOG_LEVEL_ERROR) LOGE("%s", text);
    }, nullptr);

    llama_backend_init();
    auto model_params = llama_model_default_params();
    model_params.use_mmap = true;
    model_params.use_mlock = false;

    g_model = llama_model_load_from_file(path.c_str(), model_params);
    if (!g_model) {
        LOGE("Failed to load NLLB model: %s", path.c_str());
        return false;
    }
    if (!llama_model_has_encoder(g_model)) {
        LOGE("Loaded model does not expose an encoder; NLLB model expected");
        free_model_locked();
        return false;
    }
    if (!build_language_index_locked()) {
        LOGE("Failed to index NLLB language tokens");
        free_model_locked();
        return false;
    }
    return true;
}

std::vector<llama_token> tokenize(const llama_vocab *vocab, const std::string &text) {
    std::vector<llama_token> tokens(std::max<size_t>(16, text.size() / 2 + 16));
    int32_t n = llama_tokenize(vocab, text.c_str(), static_cast<int32_t>(text.size()), tokens.data(), static_cast<int32_t>(tokens.size()), false, true);
    if (n < 0) {
        tokens.resize(static_cast<size_t>(-n));
        n = llama_tokenize(vocab, text.c_str(), static_cast<int32_t>(text.size()), tokens.data(), static_cast<int32_t>(tokens.size()), false, true);
    }
    if (n < 0) return {};
    tokens.resize(static_cast<size_t>(n));
    return tokens;
}

std::string translate_locked(const std::string &text, const std::string &src_lang, const std::string &dst_lang) {
    if (!g_model || text.empty()) return {};

    auto src_it = g_languages.find(src_lang);
    auto dst_it = g_languages.find(dst_lang);
    if (src_it == g_languages.end() || dst_it == g_languages.end()) {
        LOGE("Language token not found: %s -> %s", src_lang.c_str(), dst_lang.c_str());
        return {};
    }

    const llama_vocab *vocab = llama_model_get_vocab(g_model);
    if (!vocab) return {};

    std::vector<llama_token> source_tokens;
    source_tokens.reserve(2 + text.size() / 2);
    source_tokens.push_back(src_it->second);
    auto text_tokens = tokenize(vocab, text);
    source_tokens.insert(source_tokens.end(), text_tokens.begin(), text_tokens.end());
    source_tokens.push_back(llama_vocab_eos(vocab));

    auto ctx_params = llama_context_default_params();
    ctx_params.n_ctx = 512;
    ctx_params.n_batch = 512;
    ctx_params.n_ubatch = 512;
    ctx_params.n_threads = std::max(2, static_cast<int>(std::thread::hardware_concurrency()));
    ctx_params.n_threads_batch = ctx_params.n_threads;
    ctx_params.no_perf = true;

    llama_context *ctx = llama_init_from_model(g_model, ctx_params);
    if (!ctx) {
        LOGE("Failed to create llama context");
        return {};
    }

    std::string output;
    output.reserve(text.size() + 32);

    if (llama_encode(ctx, llama_batch_get_one(source_tokens.data(), static_cast<int32_t>(source_tokens.size()))) != 0) {
        LOGE("llama_encode failed");
        llama_free(ctx);
        return {};
    }

    llama_token initial_tokens[2] = { llama_vocab_eos(vocab), dst_it->second };
    if (llama_decode(ctx, llama_batch_get_one(initial_tokens, 2)) != 0) {
        LOGE("Initial llama_decode failed");
        llama_free(ctx);
        return {};
    }

    constexpr int max_new_tokens = 256;
    for (int step = 0; step < max_new_tokens; ++step) {
        const float *logits = llama_get_logits(ctx);
        if (!logits) break;

        const int32_t n_vocab = llama_vocab_n_tokens(vocab);
        llama_token best = 0;
        float best_score = -INFINITY;
        for (int32_t i = 0; i < n_vocab; ++i) {
            if (logits[i] > best_score) {
                best_score = logits[i];
                best = static_cast<llama_token>(i);
            }
        }

        if (llama_vocab_is_eog(vocab, best)) break;

        char piece[256];
        const int n = llama_token_to_piece(vocab, best, piece, sizeof(piece), step == 0 ? 1 : 0, true);
        if (n > 0) output.append(piece, static_cast<size_t>(n));

        if (llama_decode(ctx, llama_batch_get_one(&best, 1)) != 0) {
            LOGE("llama_decode failed at token %d", step);
            break;
        }
    }

    llama_free(ctx);
    return output;
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeInit(JNIEnv *env, jclass, jstring modelPath) {
    std::lock_guard<std::mutex> lock(g_mutex);
    const std::string path = jstring_to_string(env, modelPath);
    return init_model_locked(path) ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeTranslate(
        JNIEnv *env, jclass, jstring text, jstring srcLang, jstring dstLang) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (!g_model) return env->NewStringUTF("");
    const std::string result = translate_locked(
            jstring_to_string(env, text),
            jstring_to_string(env, srcLang),
            jstring_to_string(env, dstLang));
    return env->NewStringUTF(result.c_str());
}

extern "C" JNIEXPORT void JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeShutdown(JNIEnv *, jclass) {
    std::lock_guard<std::mutex> lock(g_mutex);
    free_model_locked();
    llama_backend_free();
}
