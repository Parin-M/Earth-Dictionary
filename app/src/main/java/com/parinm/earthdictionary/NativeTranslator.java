package com.parinm.earthdictionary;

public final class NativeTranslator {
    static {
        System.loadLibrary("earthm2m");
    }

    private NativeTranslator() {}

    public static native boolean nativeInit(String modelPath);
    public static native String nativeTranslate(String text, String srcLang, String dstLang);
    public static native void nativeSetBeamSize(int beam);
    public static native void nativeSetMaxOutput(int tokens);
    public static native void nativeShutdown();

    public static void setBeamSize(int beam) {
        nativeSetBeamSize(beam);
    }

    public static void setMaxOutput(int tokens) {
        nativeSetMaxOutput(tokens);
    }
}
