#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <thread>

#include "m2m100.h"

int main(int argc, char **argv) {
    if (argc != 2) {
        std::fprintf(stderr, "Usage: %s MODEL.gguf\n", argv[0]);
        return 2;
    }

    m2m100_context_params params = m2m100_context_default_params();
    params.n_threads = std::max(2, static_cast<int>(std::thread::hardware_concurrency()));
    params.verbosity = 1;
    params.use_gpu = false;

    m2m100_context *ctx = m2m100_init_from_file(argv[1], params);
    if (!ctx) {
        std::fprintf(stderr, "M2M100 model initialization failed\n");
        return 3;
    }

    const int languages = m2m100_n_languages(ctx);
    if (languages < 100) {
        std::fprintf(stderr, "Expected 100 M2M100 languages, got %d\n", languages);
        m2m100_free(ctx);
        return 4;
    }

    char *result = m2m100_translate(ctx, "Hello world, how are you?", "en", "fa", 64);
    if (!result || std::strlen(result) == 0) {
        std::fprintf(stderr, "M2M100 translation smoke test failed\n");
        std::free(result);
        m2m100_free(ctx);
        return 5;
    }

    std::printf("M2M100 languages: %d\n", languages);
    std::printf("Smoke translation en->fa: %s\n", result);

    std::free(result);
    m2m100_free(ctx);
    return 0;
}
