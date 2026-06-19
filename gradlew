#!/usr/bin/env sh

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/bin/java" ] ; then
        JAVACMD="$JAVA_HOME/bin/java"
    else
        JAVACMD="java"
    fi
else
    JAVACMD="java"
fi

# Locate the gradle-wrapper.jar
APP_BASE_NAME=`basename "$0"`
DIRNAME=`dirname "$0"`
if [ "$DIRNAME" = "." ] ; then
    DIRNAME="`pwd`"
fi

CLASSPATH=$DIRNAME/gradle/wrapper/gradle-wrapper.jar

# For now we delegate executing command to standard Gradle wrapper runner.
exec "$JAVACMD" -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
