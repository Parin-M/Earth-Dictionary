cmake_minimum_required(VERSION 3.22.1)
project(earthm2m)

if(NOT DEFINED CRISPASR_SRC_DIR OR NOT EXISTS "${CRISPASR_SRC_DIR}/src/m2m100.cpp")
    message(FATAL_ERROR "CRISPASR_SRC_DIR must point to a CrispASR source tree containing src/m2m100.cpp")
endif()

set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
set(GGML_NATIVE OFF CACHE BOOL "" FORCE)
set(GGML_CPU_ALL_VARIANTS OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
set(GGML_LLAMAFILE OFF CACHE BOOL "" FORCE)
set(GGML_METAL OFF CACHE BOOL "" FORCE)
set(GGML_CUDA OFF CACHE BOOL "" FORCE)
set(GGML_VULKAN OFF CACHE BOOL "" FORCE)
set(GGML_SYCL OFF CACHE BOOL "" FORCE)
set(GGML_RPC OFF CACHE BOOL "" FORCE)

find_package(Threads REQUIRED)

# CrispASR vendors the ggml revision required by its M2M100 runtime.
add_subdirectory("${CRISPASR_SRC_DIR}/ggml" ggml-src EXCLUDE_FROM_ALL)

# Only compile the small subset needed for text translation. This avoids
# pulling the full CrispASR backend library tree into the Android binary.
add_library(crispasr-core-lite STATIC
    "${CRISPASR_SRC_DIR}/src/core/gguf_loader.cpp"
)
target_include_directories(crispasr-core-lite PUBLIC
    "${CRISPASR_SRC_DIR}/src"
    "${CRISPASR_SRC_DIR}/src/core"
    "${CRISPASR_SRC_DIR}/ggml/include"
)
target_include_directories(crispasr-core-lite PRIVATE
    "${CRISPASR_SRC_DIR}/ggml/src"
)
target_compile_features(crispasr-core-lite PUBLIC cxx_std_17)
target_link_libraries(crispasr-core-lite PUBLIC ggml ggml-base)
set_target_properties(crispasr-core-lite PROPERTIES POSITION_INDEPENDENT_CODE ON)

add_library(m2m100 STATIC
    "${CRISPASR_SRC_DIR}/src/m2m100.cpp"
    "${CRISPASR_SRC_DIR}/src/m2m100.h"
)
target_include_directories(m2m100 PUBLIC
    "${CRISPASR_SRC_DIR}/src"
    "${CRISPASR_SRC_DIR}/src/core"
    "${CRISPASR_SRC_DIR}/include"
    "${CRISPASR_SRC_DIR}/ggml/include"
)
target_include_directories(m2m100 PRIVATE
    "${CRISPASR_SRC_DIR}/ggml/src"
)
target_compile_features(m2m100 PUBLIC cxx_std_17)
target_link_libraries(m2m100 PUBLIC crispasr-core-lite ggml ggml-base Threads::Threads)
set_target_properties(m2m100 PROPERTIES POSITION_INDEPENDENT_CODE ON)
if(NOT MSVC)
    target_compile_options(m2m100 PRIVATE -O3)
endif()

add_library(earthm2m SHARED native-lib.cpp)
target_compile_features(earthm2m PRIVATE cxx_std_17)
target_include_directories(earthm2m PRIVATE
    "${CRISPASR_SRC_DIR}/src"
    "${CRISPASR_SRC_DIR}/src/core"
)
target_link_libraries(earthm2m PRIVATE m2m100 Threads::Threads log android)
