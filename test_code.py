import time
led_pin = machine.Pin(2)
led_pwm = machine.PWM(led_pin, freq=1000)
try:
    while True:
        for duty in range(0, 1024, 16):
            led_pwm.duty(duty)
            time.sleep(0.02)
        for duty in range(1023, -1, -16):
            led_pwm.duty(duty)
            time.sleep(0.02)
except KeyboardInterrupt:
    led_pwm.deinit()

