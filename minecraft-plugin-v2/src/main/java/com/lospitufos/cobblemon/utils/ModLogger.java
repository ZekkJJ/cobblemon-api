package com.lospitufos.cobblemon.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Centralized logger for the plugin
 */
public class ModLogger {

    private final Logger logger;
    private final String prefix;

    public ModLogger(String modId) {
        this.logger = LoggerFactory.getLogger(modId);
        this.prefix = "[LosPitufos] ";
    }

    public void info(String message) {
        logger.info(prefix + message);
    }

    public void warn(String message) {
        logger.warn(prefix + message);
    }

    public void error(String message) {
        logger.error(prefix + message);
    }

    public void error(String message, Throwable throwable) {
        logger.error(prefix + message, throwable);
    }

    public void debug(String message) {
        logger.debug(prefix + message);
    }
}
