#include <jni.h>
#include <android/log.h>
#include <algorithm>
#include <cstdlib>
#include <mutex>
#include <string>
#include <thread>

#include "m2m100.h"

#define LOG_TAG "EarthM2M"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace {
std::mutex g_mutex;
m2m100_context *g_context = nullptr;
int g_beam_size = 5;
int g_max_output_tokens = 256;

std::string jstring_to_string(JNIEnv *env, jstring value) {
    if (!value) return {};
    const char *chars = env->GetStringUTFChars(value, nullptr);
    std::string result = chars ? chars : "";
    if (chars) env->ReleaseStringUTFChars(value, chars);
    return result;
}

bool init_context_locked(const std::string &path) {
    if (g_context) return true;
    m2m100_context_params params = m2m100_context_default_params();
    params.n_threads = std::max(2, static_cast<int>(std::thread::hardware_concurrency()));
    params.verbosity = 0;
    params.use_gpu = false;

    g_context = m2m100_init_from_file(path.c_str(), params);
    if (!g_context) {
        LOGE("Failed to load M2M100 model: %s", path.c_str());
        return false;
    }

    m2m100_set_beam_size(g_context, g_beam_size);
    return true;
}

void free_context_locked() {
    if (g_context) {
        m2m100_free(g_context);
        g_context = nullptr;
    }
}

std::string translate_locked(const std::string &text, const std::string &src_lang, const std::string &dst_lang) {
    if (!g_context || text.empty()) return {};

    char *translated = m2m100_translate(
        g_context,
        text.c_str(),
        src_lang.c_str(),
        dst_lang.c_str(),
        g_max_output_tokens
    );

    if (!translated) {
        LOGE("M2M100 translation failed: %s -> %s", src_lang.c_str(), dst_lang.c_str());
        return {};
    }

    std::string result(translated);
    std::free(translated);
    return result;
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeInit(JNIEnv *env, jclass, jstring modelPath) {
    std::lock_guard<std::mutex> lock(g_mutex);
    return init_context_locked(jstring_to_string(env, modelPath)) ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeTranslate(
        JNIEnv *env, jclass, jstring text, jstring srcLang, jstring dstLang) {
    std::lock_guard<std::mutex> lock(g_mutex);

    if (!g_context) return env->NewStringUTF("");

    const std::string result = translate_locked(
        jstring_to_string(env, text),
        jstring_to_string(env, srcLang),
        jstring_to_string(env, dstLang)
    );

    return env->NewStringUTF(result.c_str());
}

extern "C" JNIEXPORT void JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeSetBeamSize(JNIEnv *, jclass, jint beam) {
    std::lock_guard<std::mutex> lock(g_mutex);
    g_beam_size = std::max(1, std::min(static_cast<int>(beam), 8));
    if (g_context) m2m100_set_beam_size(g_context, g_beam_size);
}

extern "C" JNIEXPORT void JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeSetMaxOutput(JNIEnv *, jclass, jint tokens) {
    std::lock_guard<std::mutex> lock(g_mutex);
    g_max_output_tokens = std::max(64, std::min(static_cast<int>(tokens), 1024));
}

extern "C" JNIEXPORT void JNICALL
Java_com_parinm_earthdictionary_NativeTranslator_nativeShutdown(JNIEnv *, jclass) {
    std::lock_guard<std::mutex> lock(g_mutex);
    free_context_locked();
}
