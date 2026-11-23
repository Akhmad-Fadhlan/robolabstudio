FROM node:22-bookworm-slim

ARG ARDUINO_CLI_VERSION=1.3.1
ARG ESP32_CORE_VERSION=3.3.0
ENV ESP32_BOOT_APP_PATH=/opt/arduino/data/packages/esp32/hardware/esp32/${ESP32_CORE_VERSION}/tools/partitions/boot_app0.bin
ENV ARDUINO_DIRECTORIES_DATA=/opt/arduino/data ARDUINO_DIRECTORIES_DOWNLOADS=/tmp/arduino-downloads ARDUINO_DIRECTORIES_USER=/opt/arduino/user
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl python3 python3-serial util-linux \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL "https://downloads.arduino.cc/arduino-cli/arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz" | tar -xz -C /usr/local/bin arduino-cli \
    && arduino-cli core update-index --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json \
    && arduino-cli core install "esp32:esp32@${ESP32_CORE_VERSION}" --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json \
    && rm -rf "$ARDUINO_DIRECTORIES_DOWNLOADS" \
    && useradd --uid 10001 --create-home compiler \
    && test -s "$ESP32_BOOT_APP_PATH" \
    && mkdir -p "$ARDUINO_DIRECTORIES_USER" "$ARDUINO_DIRECTORIES_DOWNLOADS" /home/compiler/.cache /opt/build-warm/Blink \
    && printf 'void setup() {}\nvoid loop() {}\n' > /opt/build-warm/Blink/Blink.ino \
    && chown -R compiler:compiler /home/compiler /opt/build-warm "$ARDUINO_DIRECTORIES_DOWNLOADS" \
    && su -s /bin/sh compiler -c 'arduino-cli compile --fqbn esp32:esp32:esp32:FlashMode=dio,PartitionScheme=huge_app --jobs 1 /opt/build-warm/Blink' \
    && rm -rf /opt/build-warm

WORKDIR /app
COPY services/esp32-compiler/service.cjs ./services/esp32-compiler/service.cjs
COPY server/arduino-sketch.cjs ./server/arduino-sketch.cjs
EXPOSE 8080
CMD ["node", "services/esp32-compiler/service.cjs"]
