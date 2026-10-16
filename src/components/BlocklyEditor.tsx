import React, { useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { Play, Square, RotateCcw, Trash2, Blocks } from 'lucide-react';
import {
  type RobotHardwareConfig,
  type RobotPlan,
  type RobotPlanItem,
  type ActiveExecutionHighlight,
  type SensorCount,
  type PlanActionType,
  type PlanTriggerMode,
  type PlanLogicOp,
  type PlanDurationUnit,
  type PlanLineColor,
  type StopHereStage,
  createDefaultRobotHardwareConfig,
  normalizeSensorPattern,
  getDefaultSensorPattern,
  getSensorPresetOptions,
  findMatchingSensorPreset,
  type SensorPresetOption,
  getBoardPinOptions,
  generateRobotPlanArduinoCode,
  generateRobotPlanPythonCode,
} from '../types/robotSimulator';

// Live hardware config reference used by dynamic Blockly dropdowns & pattern validators
let activeRobotHwConfig: RobotHardwareConfig = createDefaultRobotHardwareConfig();

const registerRobotPlanBlocks = () => {
  const getDurationUnitOptions = (): [string, string][] => {
    return [
      ['⏱️ ms', 'ms'],
      ['⚙️ Encoder L', 'enc_l'],
      ['⚙️ Encoder R', 'enc_r'],
    ];
  };

  // 1. Block Setup Hardware & Pin Robot (PWM, Multiplexer 4067/4051, Encoder, RPM)
  Blockly.Blocks['robot_hw_setup'] = {
    init: function (this: Blockly.Block) {
      const pins = getBoardPinOptions(activeRobotHwConfig.mcu);
      const pwmOpts: [string, string][] = pins.pwmPins.map((p) => [p, p]);
      const adcOpts: [string, string][] = pins.analogPins.map((p) => [p, p]);
      const intOpts: [string, string][] = pins.interruptPins.map((p) => [p, p]);

      this.appendDummyInput()
        .appendField('⚙️ Setup Robot │ Motor PWM L')
        .appendField(new Blockly.FieldDropdown(pwmOpts), 'PWM_L')
        .appendField('PWM R')
        .appendField(new Blockly.FieldDropdown(pwmOpts), 'PWM_R')
        .appendField('│ RPM Motor')
        .appendField(new Blockly.FieldNumber(activeRobotHwConfig.motorRpm, 50, 3000, 10), 'MOTOR_RPM');
      const sensorOpts: [string, string][] = [
        ['2 Sensor', '2'],
        ['4 Sensor', '4'],
        ['5 Sensor', '5'],
        ['6 Sensor', '6'],
        ['8 Sensor', '8'],
        ['12 Sensor', '12'],
      ];

      this.appendDummyInput()
        .appendField('🔍 Sensor')
        .appendField(new Blockly.FieldDropdown(sensorOpts), 'SENSOR_COUNT')
        .appendField('Mode')
        .appendField(
          new Blockly.FieldDropdown([
            ['Multiplexer 4067 (16-Ch)', 'mux_4067'],
            ['Multiplexer 4051 (8-Ch)', 'mux_4051'],
            ['Direct Pin', 'direct'],
          ]),
          'SENSOR_MODE'
        )
        .appendField('Mux SIG')
        .appendField(new Blockly.FieldDropdown(adcOpts), 'MUX_SIG')
        .appendField('│ Encoder')
        .appendField(
          new Blockly.FieldDropdown([
            ['✅ Aktif (ms/Enc L/Enc R)', 'YES'],
            ['❌ Tidak Ada (Hanya ms)', 'NO'],
          ]),
          'HAS_ENCODER'
        )
        .appendField('Pin Enc L/R')
        .appendField(new Blockly.FieldDropdown(intOpts), 'ENC_L')
        .appendField(new Blockly.FieldDropdown(intOpts), 'ENC_R');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0ea5e9');
      this.setTooltip(
        'Otomatis mengatur pin PWM motor, sensor multiplexer, interrupt encoder, dan RPM motor ke kode .ino & .py'
      );
    },
  };

  // 2. Block Container: Buat Plan 1 s/d 10
  Blockly.Blocks['robot_plan_container'] = {
    init: function (this: Blockly.Block) {
      const planOpts: [string, string][] = Array.from({ length: 10 }, (_, i) => [
        `Plan ${i + 1}`,
        String(i + 1),
      ]);
      this.appendDummyInput()
        .appendField('📋 Buat')
        .appendField(new Blockly.FieldDropdown(planOpts), 'PLAN_ID')
        .appendField('— Susun Urutan Index Step Robot');
      this.appendStatementInput('STEPS').setCheck(null).appendField('Langkah');
      this.setColour('#f97316');
      this.setTooltip('Wadah Plan 1 sampai 10 berisi urutan Index Step robot dan Stop Disini');
    },
  };

  // 3. Block: Jalankan Plan 1 s/d 10
  Blockly.Blocks['robot_run_plan'] = {
    init: function (this: Blockly.Block) {
      const planOpts: [string, string][] = Array.from({ length: 10 }, (_, i) => [
        `Plan ${i + 1}`,
        String(i + 1),
      ]);
      this.appendDummyInput()
        .appendField('🚀 Jalankan')
        .appendField(new Blockly.FieldDropdown(planOpts), 'PLAN_ID');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#10b981');
      this.setTooltip('Menjalankan Plan 1 s/d 10 yang sudah disusun');
    },
  };

  // 4. Block: Step Index (Rumus Lengkap: Index, Aksi + Angka ms/Enc L/Enc R, Jika Motion/Poin Sensor 00xx00 Op, Break, Speed L/R, PID 1-5, Lanjut Speed A, Timer, Garis)
  Blockly.Blocks['robot_plan_step'] = {
    init: function (this: Blockly.Block) {
      const count = activeRobotHwConfig?.sensorCount || 6;
      const defaultPat = getDefaultSensorPattern(count);

      const presetDropdown = new Blockly.FieldDropdown(() => {
        const curCount = activeRobotHwConfig?.sensorCount || 6;
        const opts = getSensorPresetOptions(curCount);
        const list: [string, string][] = opts.map((opt) => [
          `${opt.label} [${opt.pattern}]`,
          opt.pattern,
        ]);
        list.push(['✏️ Kustom (Atur 0/x Bebas)', 'CUSTOM']);
        return list;
      });

      const patternField = new Blockly.FieldTextInput(defaultPat, (newVal: string) => {
        return normalizeSensorPattern(newVal, activeRobotHwConfig?.sensorCount || 6);
      });

      this.appendDummyInput()
        .appendField('🔢 Index')
        .appendField(new Blockly.FieldNumber(0, 0, 99, 1), 'INDEX')
        .appendField('│ Aksi')
        .appendField(
          new Blockly.FieldDropdown([
            ['⬆️ Maju', 'MAJU'],
            ['⬇️ Mundur', 'MUNDUR'],
            ['↩️ Left (Kiri)', 'LEFT'],
            ['↪️ Right (Kanan)', 'RIGHT'],
            ['⏸️ Pause', 'PAUSE'],
          ]),
          'ACTION'
        )
        .appendField(new Blockly.FieldNumber(100, 0, 20000, 10), 'TRIG_VAL')
        .appendField(new Blockly.FieldDropdown(getDurationUnitOptions), 'TRIG_UNIT')
        .appendField('│ Jika')
        .appendField(
          new Blockly.FieldDropdown([
            ['🎯 Poin Sensor', 'SENSOR'],
            ['⚡ Motion (Tanpa Sensor)', 'MOTION'],
          ]),
          'TRIG_MODE'
        )
        .appendField(presetDropdown, 'SENSOR_PRESET')
        .appendField(patternField, 'PATTERN')
        .appendField(
          new Blockly.FieldDropdown([
            ['EQUAL', 'EQUAL'],
            ['AND', 'AND'],
            ['OR', 'OR'],
            ['XOR', 'XOR'],
          ]),
          'LOGIC_OP'
        )
        .appendField('│ Break')
        .appendField(new Blockly.FieldNumber(0, 0, 1000, 5), 'BRAKE');

      this.appendDummyInput()
        .appendField('   ⚙️ Speed L')
        .appendField(new Blockly.FieldNumber(160, -255, 255, 5), 'SPEED_L')
        .appendField('Speed R')
        .appendField(new Blockly.FieldNumber(160, -255, 255, 5), 'SPEED_R')
        .appendField('│ Kontrol')
        .appendField(
          new Blockly.FieldDropdown([
            ['PID 1 (Halus)', '1'],
            ['PID 2 (Standar)', '2'],
            ['PID 3 (Tikungan)', '3'],
            ['PID 4 (Cepat)', '4'],
            ['PID 5 (Presisi)', '5'],
            ['Tanpa PID', '0'],
          ]),
          'PID_ID'
        )
        .appendField('│ ➡️ Lanjut Speed A')
        .appendField(new Blockly.FieldNumber(120, -255, 255, 5), 'SPEED_A')
        .appendField('Timer')
        .appendField(new Blockly.FieldNumber(120, 0, 10000, 10), 'TIMER_VAL')
        .appendField(new Blockly.FieldDropdown(getDurationUnitOptions), 'TIMER_UNIT')
        .appendField('│ Garis')
        .appendField(
          new Blockly.FieldDropdown([
            ['⬛ Hitam', 'HITAM'],
            ['⬜ Putih', 'PUTIH'],
          ]),
          'LINE_COLOR'
        );

      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#3b82f6');
      this.setTooltip(
        "Step Index Robot: Pilihan kombinasi sensor (Kanan, Kiri, Tengah Kiri/Kanan, Sayap, Perempatan) menyesuaikan jumlah sensor robot. '0' = membaca garis, 'x' = diabaikan."
      );

      this.setOnChange(function (this: Blockly.Block, changeEvent: any) {
        if (!changeEvent || changeEvent.blockId !== this.id) return;
        if (changeEvent.type !== Blockly.Events.BLOCK_CHANGE) return;
        if (this.workspace?.isFlyout) return;

        if (changeEvent.name === 'SENSOR_PRESET') {
          const selectedVal = this.getFieldValue('SENSOR_PRESET');
          if (selectedVal && selectedVal !== 'CUSTOM') {
            const curPat = this.getFieldValue('PATTERN');
            if (curPat !== selectedVal) {
              this.setFieldValue(selectedVal, 'PATTERN');
            }
          }
        } else if (changeEvent.name === 'PATTERN') {
          const curPat = this.getFieldValue('PATTERN') || '';
          const activeSc = activeRobotHwConfig?.sensorCount || 6;
          const matched = findMatchingSensorPreset(curPat, activeSc);
          const target = matched ? matched.pattern : 'CUSTOM';
          const curPreset = this.getFieldValue('SENSOR_PRESET');
          if (curPreset !== target) {
            this.setFieldValue(target, 'SENSOR_PRESET');
          }
        }
      });
    },
  };

  // 5. Block: Stop Disini (Interrupt pada Tahap Action / Speed A)
  Blockly.Blocks['robot_plan_stop'] = {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('🛑 Stop Disini (Interrupt Robot) │ Berhenti pada Tahap:')
        .appendField(
          new Blockly.FieldDropdown([
            ['Tahap Action (Sebelum Speed A)', 'ACTION'],
            ['Tahap Speed A (Setelah Timer Speed A)', 'SPEED_A'],
          ]),
          'STOP_STAGE'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ef4444');
      this.setTooltip(
        'Menginterupsi dan menghentikan robot tepat pada Index di atasnya (pada Tahap Action atau Tahap Speed A)'
      );
    },
  };
};

registerRobotPlanBlocks();

const PLUS_ELSEIF_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='65' height='20' viewBox='0 0 65 20'><rect x='0' y='0' width='65' height='20' rx='10' fill='%2322c55e'/><path d='M7 10h6M10 7v6' stroke='%23ffffff' stroke-width='2' stroke-linecap='round'/><text x='18' y='14' fill='%23ffffff' font-size='11' font-family='sans-serif' font-weight='bold'>+ else if</text></svg>";

const PLUS_ELSE_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='55' height='20' viewBox='0 0 55 20'><rect x='0' y='0' width='55' height='20' rx='10' fill='%233b82f6'/><path d='M7 10h6M10 7v6' stroke='%23ffffff' stroke-width='2' stroke-linecap='round'/><text x='18' y='14' fill='%23ffffff' font-size='11' font-family='sans-serif' font-weight='bold'>+ else</text></svg>";

const MINUS_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='55' height='20' viewBox='0 0 55 20'><rect x='0' y='0' width='55' height='20' rx='10' fill='%23ef4444'/><path d='M7 10h6' stroke='%23ffffff' stroke-width='2' stroke-linecap='round'/><text x='17' y='14' fill='%23ffffff' font-size='11' font-family='sans-serif' font-weight='bold'>hapus</text></svg>";


// Custom controls_if block with direct + else if, + else, and hapus buttons
Blockly.Blocks['controls_if'] = {
  init: function (this: any) {
    this.elseifCount_ = 0;
    this.elseCount_ = 0;
    this.setHelpUrl(Blockly.Msg['CONTROLS_IF_HELPURL'] || '');
    this.setStyle('logic_blocks');

    this.appendValueInput('IF0')
      .setCheck('Boolean')
      .appendField(Blockly.Msg['CONTROLS_IF_MSG_IF'] || 'jika');
    this.appendStatementInput('DO0')
      .appendField(Blockly.Msg['CONTROLS_IF_MSG_THEN'] || 'maka');

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);

    try {
      this.setMutator(new (Blockly as any).Mutator(['controls_if_elseif', 'controls_if_else']));
    } catch (_) {}

    this.updateShape_();
  },

  mutationToDom: function (this: any) {
    if (!this.elseifCount_ && !this.elseCount_) {
      return null;
    }
    const container = Blockly.utils.xml.createElement('mutation');
    if (this.elseifCount_) {
      container.setAttribute('elseif', String(this.elseifCount_));
    }
    if (this.elseCount_) {
      container.setAttribute('else', '1');
    }
    return container;
  },

  domToMutation: function (this: any, xmlElement: Element) {
    this.elseifCount_ = parseInt(xmlElement.getAttribute('elseif') || '0', 10) || 0;
    this.elseCount_ = parseInt(xmlElement.getAttribute('else') || '0', 10) || 0;
    this.updateShape_();
  },

  saveExtraState: function (this: any) {
    if (!this.elseifCount_ && !this.elseCount_) {
      return null;
    }
    return {
      'elseifCount': this.elseifCount_ || undefined,
      'hasElse': this.elseCount_ ? true : undefined,
    };
  },

  loadExtraState: function (this: any, state: any) {
    this.elseifCount_ = state?.['elseifCount'] || 0;
    this.elseCount_ = state?.['hasElse'] ? 1 : 0;
    this.updateShape_();
  },

  updateShape_: function (this: any) {
    let elseConnection: any = null;
    if (this.getInput('ELSE')) {
      elseConnection = this.getInput('ELSE').connection?.targetConnection || null;
      this.removeInput('ELSE');
    }

    if (this.getInput('MUTATOR_BUTTONS')) {
      this.removeInput('MUTATOR_BUTTONS');
    }

    for (let i = 1; i <= this.elseifCount_; i++) {
      if (!this.getInput(`IF${i}`)) {
        this.appendValueInput(`IF${i}`)
          .setCheck('Boolean')
          .appendField(Blockly.Msg['CONTROLS_IF_MSG_ELSEIF'] || 'lain jika');
        this.appendStatementInput(`DO${i}`)
          .appendField(Blockly.Msg['CONTROLS_IF_MSG_THEN'] || 'maka');
      }
    }
    let i = this.elseifCount_ + 1;
    while (this.getInput(`IF${i}`)) {
      this.removeInput(`IF${i}`);
      this.removeInput(`DO${i}`);
      i++;
    }

    if (this.elseCount_) {
      const elseInput = this.appendStatementInput('ELSE')
        .appendField(Blockly.Msg['CONTROLS_IF_MSG_ELSE'] || 'lainnya');
      if (elseConnection && elseInput.connection) {
        elseConnection.reconnect(this, 'ELSE');
      }
    }

    const buttonInput = this.appendDummyInput('MUTATOR_BUTTONS');

    const btnPlusElseIf = new Blockly.FieldImage(
      PLUS_ELSEIF_SVG,
      65,
      20,
      '+ else if',
      () => {
        this.elseifCount_++;
        this.updateShape_();
        if (this.render) this.render();
        if (this.workspace) {
          Blockly.Events.fire(new Blockly.Events.BlockChange(this, 'mutation', null, null, null));
        }
      }
    );
    buttonInput.appendField(btnPlusElseIf);

    if (!this.elseCount_) {
      const btnPlusElse = new Blockly.FieldImage(
        PLUS_ELSE_SVG,
        55,
        20,
        '+ else',
        () => {
          this.elseCount_ = 1;
          this.updateShape_();
          if (this.render) this.render();
          if (this.workspace) {
            Blockly.Events.fire(new Blockly.Events.BlockChange(this, 'mutation', null, null, null));
          }
        }
      );
      buttonInput.appendField(btnPlusElse);
    }

    if (this.elseifCount_ > 0 || this.elseCount_ > 0) {
      const btnMinus = new Blockly.FieldImage(
        MINUS_SVG,
        55,
        20,
        'hapus',
        () => {
          if (this.elseCount_ > 0) {
            this.elseCount_ = 0;
          } else if (this.elseifCount_ > 0) {
            this.elseifCount_--;
          }
          this.updateShape_();
          if (this.render) this.render();
          if (this.workspace) {
            Blockly.Events.fire(new Blockly.Events.BlockChange(this, 'mutation', null, null, null));
          }
        }
      );
      buttonInput.appendField(btnMinus);
    }
  }
};


// Define custom blocks if they aren't defined yet
try {
  Blockly.defineBlocksWithJsonArray([
    // 1. Structure blocks
    {
      "type": "arduino_setup",
      "message0": "void setup() {\n %1 }",
      "args0": [
        {
          "type": "input_statement",
          "name": "STACK"
        }
      ],
      "colour": "#FF6680",
      "tooltip": "Function that runs once at microcontroller startup",
      "helpUrl": ""
    },
    {
      "type": "arduino_loop",
      "message0": "void loop() {\n %1 }",
      "args0": [
        {
          "type": "input_statement",
          "name": "STACK"
        }
      ],
      "colour": "#FFAB19",
      "tooltip": "Main function that loops continuously",
      "helpUrl": ""
    },
    {
      "type": "raw_code",
      "message0": "Raw Code %1",
      "args0": [
        {
          "type": "field_input",
          "name": "CODE",
          "text": "code here"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#64748B",
      "tooltip": "Raw source code block",
      "helpUrl": ""
    },
    {
      "type": "raw_statement",
      "message0": "Code Block %1 \n %2",
      "args0": [
        {
          "type": "field_input",
          "name": "CODE",
          "text": "statement:"
        },
        {
          "type": "input_statement",
          "name": "STACK"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#64748B",
      "tooltip": "Raw python block with inner statements",
      "helpUrl": ""
    },
    // 2. Pin blocks
    {
      "type": "pin_digital_write",
      "message0": "digitalWrite Pin %1 to %2",
      "args0": [
        {
          "type": "field_input",
          "name": "PIN",
          "text": "2"
        },
        {
          "type": "field_dropdown",
          "name": "STATE",
          "options": [
            ["HIGH", "HIGH"],
            ["LOW", "LOW"]
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#9966FF",
      "tooltip": "Write HIGH or LOW state to a digital GPIO pin",
      "helpUrl": ""
    },
    {
      "type": "pin_digital_read",
      "message0": "digitalRead Pin %1",
      "args0": [
        {
          "type": "field_input",
          "name": "PIN",
          "text": "4"
        }
      ],
      "output": "Boolean",
      "colour": "#9966FF",
      "tooltip": "Read binary state (HIGH/LOW) from a GPIO pin",
      "helpUrl": ""
    },
    // 4. Sensors
    {
      "type": "sensor_ultrasonic",
      "message0": "Read Ultrasonic Trigger %1 Echo %2",
      "args0": [
        {
          "type": "field_number",
          "name": "TRIGGER",
          "value": 12,
          "min": 0
        },
        {
          "type": "field_number",
          "name": "ECHO",
          "value": 13,
          "min": 0
        }
      ],
      "output": "Number",
      "colour": "#A855F7",
      "tooltip": "Read distance from ultrasonic sensor in cm",
      "helpUrl": ""
    },
    // 5. AI Vision
    {
      "type": "ai_detect",
      "message0": "AI Detect Object %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OBJECT",
          "options": [
            ["Ball", "ball"],
            ["Hand Gesture", "hand_gesture"],
            ["Face", "face"],
            ["Line", "line"]
          ]
        }
      ],
      "output": "Boolean",
      "colour": "#D946EF",
      "tooltip": "Returns true if specified object/gesture is detected",
      "helpUrl": ""
    },
    // 6. Logic Compare
    {
      "type": "robolab_logic_compare",
      "message0": "%1 %2 %3",
      "args0": [
        {
          "type": "input_value",
          "name": "A"
        },
        {
          "type": "field_dropdown",
          "name": "OP",
          "options": [
            ["<", "LT"],
            [">", "GT"],
            ["=", "EQ"],
            ["!=", "NEQ"],
            ["<=", "LTE"],
            [">=", "GTE"]
          ]
        },
        {
          "type": "input_value",
          "name": "B"
        }
      ],
      "output": "Boolean",
      "colour": "#4C97FF",
      "tooltip": "Compares two numbers or values",
      "helpUrl": ""
    },
    // 7. General Delay
    {
      "type": "arduino_delay",
      "message0": "delay %1 ms",
      "args0": [
        {
          "type": "field_number",
          "name": "MS",
          "value": 1000,
          "min": 0
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#FF4081",
      "tooltip": "Delay execution for milliseconds",
      "helpUrl": ""
    },
    // 8. Pin analog blocks
    {
      "type": "pin_analog_write",
      "message0": "analogWrite Pin %1 to value %2 (freq %3 Hz)",
      "args0": [
        {
          "type": "field_input",
          "name": "PIN",
          "text": "5"
        },
        {
          "type": "input_value",
          "name": "VALUE"
        },
        {
          "type": "field_number",
          "name": "FREQ",
          "value": 1000,
          "min": 1,
          "max": 40000000
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#9966FF",
      "tooltip": "Write PWM analog value (0-255) to a pin with a specific frequency",
      "helpUrl": ""
    },
    {
      "type": "pin_analog_read",
      "message0": "analogRead Pin %1",
      "args0": [
        {
          "type": "field_input",
          "name": "PIN",
          "text": "A0"
        }
      ],
      "output": "Number",
      "colour": "#9966FF",
      "tooltip": "Read analog value (0-1023 / 0-4095) from an analog pin",
      "helpUrl": ""
    },
    // 9. Serial Print
    {
      "type": "arduino_serial_print",
      "message0": "Serial.println %1",
      "args0": [
        {
          "type": "input_value",
          "name": "TEXT"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#4CBFE6",
      "tooltip": "Print value to serial logging feed with newline",
      "helpUrl": ""
    },
    // 10. Serial Available
    {
      "type": "arduino_serial_available",
      "message0": "Serial.available()",
      "output": "Number",
      "colour": "#4CBFE6",
      "tooltip": "Get the number of bytes available for reading from the serial port",
      "helpUrl": ""
    },
    // 11. Serial Read
    {
      "type": "arduino_serial_read",
      "message0": "Serial.read()",
      "output": "Number",
      "colour": "#4CBFE6",
      "tooltip": "Read incoming serial data",
      "helpUrl": ""
    },
    // 12. Servo Write
    {
      "type": "arduino_servo_write",
      "message0": "Servo on Pin %1 write angle %2",
      "args0": [
        {
          "type": "field_number",
          "name": "PIN",
          "value": 9,
          "min": 0
        },
        {
          "type": "input_value",
          "name": "ANGLE"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#FF6D00",
      "tooltip": "Write an angle (0-180) to a servo motor",
      "helpUrl": ""
    },
    // 13. Serial Print Inline (New)
    {
      "type": "arduino_serial_print_inline",
      "message0": "Serial.print %1",
      "args0": [
        {
          "type": "input_value",
          "name": "TEXT"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#4CBFE6",
      "tooltip": "Print value to serial without newline",
      "helpUrl": ""
    },
    // 14. Arduino Map (New)
    {
      "type": "arduino_map",
      "message0": "map %1 from [%2, %3] to [%4, %5]",
      "args0": [
        { "type": "input_value", "name": "VAL" },
        { "type": "input_value", "name": "FL" },
        { "type": "input_value", "name": "FH" },
        { "type": "input_value", "name": "TL" },
        { "type": "input_value", "name": "TH" }
      ],
      "output": "Number",
      "colour": "#40BF4A",
      "tooltip": "Re-maps a number from one range to another",
      "helpUrl": ""
    },
    // 15. Arduino Constrain (New)
    {
      "type": "arduino_constrain",
      "message0": "constrain %1 between %2 and %3",
      "args0": [
        { "type": "input_value", "name": "VAL" },
        { "type": "input_value", "name": "LOW" },
        { "type": "input_value", "name": "HIGH" }
      ],
      "output": "Number",
      "colour": "#40BF4A",
      "tooltip": "Constrains a number to be within a range",
      "helpUrl": ""
    },
    // 16. Arduino Random (New)
    {
      "type": "arduino_random",
      "message0": "random between %1 and %2",
      "args0": [
        { "type": "input_value", "name": "MIN" },
        { "type": "input_value", "name": "MAX" }
      ],
      "output": "Number",
      "colour": "#40BF4A",
      "tooltip": "Generate a random number in range",
      "helpUrl": ""
    },
    // 17. Arduino Tone (New)
    {
      "type": "arduino_tone",
      "message0": "Tone on Pin %1 freq %2 Hz duration %3 ms",
      "args0": [
        { "type": "field_number", "name": "PIN", "value": 8 },
        { "type": "input_value", "name": "FREQ" },
        { "type": "input_value", "name": "DURATION" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#E040FB",
      "tooltip": "Generate a square wave of specified frequency on a pin",
      "helpUrl": ""
    },
    // 18. Arduino noTone (New)
    {
      "type": "arduino_notone",
      "message0": "noTone on Pin %1",
      "args0": [
        { "type": "field_number", "name": "PIN", "value": 8 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#E040FB",
      "tooltip": "Stop generating square wave on pin",
      "helpUrl": ""
    },
    // 19. Arduino pulseIn (New)
    {
      "type": "arduino_pulsein",
      "message0": "pulseIn Pin %1 State %2",
      "args0": [
        { "type": "field_number", "name": "PIN", "value": 7 },
        {
          "type": "field_dropdown",
          "name": "STATE",
          "options": [
            ["HIGH", "HIGH"],
            ["LOW", "LOW"]
          ]
        }
      ],
      "output": "Number",
      "colour": "#9966FF",
      "tooltip": "Reads a pulse (either HIGH or LOW) on a pin",
      "helpUrl": ""
    },
    // 20. ESP32 WiFi Connect
    {
      "type": "esp32_wifi_connect",
      "message0": "WiFi Connect SSID %1 Pass %2",
      "args0": [
        { "type": "input_value", "name": "SSID" },
        { "type": "input_value", "name": "PASS" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#0EA5E9",
      "tooltip": "Connect ESP32 to a WiFi Access Point",
      "helpUrl": ""
    },
    // 21. ESP32 WiFi Status
    {
      "type": "esp32_wifi_status",
      "message0": "WiFi Is Connected?",
      "output": "Boolean",
      "colour": "#0EA5E9",
      "tooltip": "Check if connected to WiFi network",
      "helpUrl": ""
    },
    // 22. ESP32 WiFi IP
    {
      "type": "esp32_wifi_ip",
      "message0": "WiFi Local IP",
      "output": "String",
      "colour": "#0EA5E9",
      "tooltip": "Get local IP address of ESP32",
      "helpUrl": ""
    },
    // HTTP GET
    {
      "type": "esp32_http_get",
      "message0": "HTTP GET URL %1",
      "args0": [
        { "type": "input_value", "name": "URL" }
      ],
      "output": "String",
      "colour": "#0EA5E9",
      "tooltip": "Perform HTTP GET request and return payload",
      "helpUrl": ""
    },
    // HTTP POST
    {
      "type": "esp32_http_post",
      "message0": "HTTP POST URL %1 ContentType %2 Data %3",
      "args0": [
        { "type": "input_value", "name": "URL" },
        { "type": "input_value", "name": "CONTENT_TYPE" },
        { "type": "input_value", "name": "DATA" }
      ],
      "output": "String",
      "colour": "#0EA5E9",
      "tooltip": "Perform HTTP POST request and return payload",
      "helpUrl": ""
    },
    // WebSocket Connect
    {
      "type": "esp32_websocket_connect",
      "message0": "WebSocket Connect Host %1 Port %2 Path %3",
      "args0": [
        { "type": "input_value", "name": "HOST" },
        { "type": "input_value", "name": "PORT" },
        { "type": "input_value", "name": "PATH" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#06B6D4",
      "tooltip": "Connect to WebSocket server",
      "helpUrl": ""
    },
    // WebSocket Loop
    {
      "type": "esp32_websocket_loop",
      "message0": "WebSocket Keep Alive (Loop)",
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#06B6D4",
      "tooltip": "Keep WebSocket connection alive (place inside Loop)",
      "helpUrl": ""
    },
    // WebSocket Send
    {
      "type": "esp32_websocket_send",
      "message0": "WebSocket Send Text %1",
      "args0": [
        { "type": "input_value", "name": "TEXT" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#06B6D4",
      "tooltip": "Send text message over WebSocket",
      "helpUrl": ""
    },
    // WebSocket Has Message
    {
      "type": "esp32_websocket_has_message",
      "message0": "WebSocket Has Message?",
      "output": "Boolean",
      "colour": "#06B6D4",
      "tooltip": "Check if a new WebSocket message has arrived",
      "helpUrl": ""
    },
    // WebSocket Get Message
    {
      "type": "esp32_websocket_get_message",
      "message0": "WebSocket Read Message",
      "output": "String",
      "colour": "#06B6D4",
      "tooltip": "Read the latest WebSocket message",
      "helpUrl": ""
    },
    // Blynk Config
    {
      "type": "blynk_config",
      "message0": "Blynk Config Template ID %1 Name %2 Auth %3",
      "args0": [
        { "type": "input_value", "name": "TEMPLATE_ID" },
        { "type": "input_value", "name": "TEMPLATE_NAME" },
        { "type": "input_value", "name": "AUTH_TOKEN" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#22C55E",
      "tooltip": "Configure Blynk Template ID, Name, and Auth Token",
      "helpUrl": ""
    },
    // Blynk Begin
    {
      "type": "blynk_begin",
      "message0": "Blynk Begin Auth %1 SSID %2 Pass %3",
      "args0": [
        { "type": "input_value", "name": "AUTH" },
        { "type": "input_value", "name": "SSID" },
        { "type": "input_value", "name": "PASS" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#22C55E",
      "tooltip": "Connect to WiFi and Blynk IoT Server",
      "helpUrl": ""
    },
    // Blynk Run
    {
      "type": "blynk_run",
      "message0": "Blynk Run",
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#22C55E",
      "tooltip": "Process Blynk communications (place inside Loop)",
      "helpUrl": ""
    },
    // Blynk On Write Callback
    {
      "type": "blynk_on_write",
      "message0": "Blynk On Write %1 %2 %3",
      "args0": [
        { "type": "field_input", "name": "VPIN", "text": "V0" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "STACK" }
      ],
      "colour": "#22C55E",
      "tooltip": "Executed when widget value changes on Virtual Pin",
      "helpUrl": ""
    },
    // Blynk Param As Int
    {
      "type": "blynk_param_as_int",
      "message0": "Blynk Parameter Value (Integer)",
      "output": "Number",
      "colour": "#22C55E",
      "tooltip": "Get integer value sent from Blynk widget in BLYNK_WRITE",
      "helpUrl": ""
    },
    // Blynk Virtual Write
    {
      "type": "blynk_virtual_write",
      "message0": "Blynk Virtual Write Pin %1 Value %2",
      "args0": [
        { "type": "field_input", "name": "VPIN", "text": "V0" },
        { "type": "input_value", "name": "VALUE" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#22C55E",
      "tooltip": "Send data to a Virtual Pin in Blynk App",
      "helpUrl": ""
    },
    // 23. ESP32 BT Begin
    {
      "type": "esp32_bluetooth_begin",
      "message0": "Bluetooth Begin Name %1",
      "args0": [
        { "type": "input_value", "name": "NAME" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#00B0FF",
      "tooltip": "Initialize Bluetooth Serial with device name",
      "helpUrl": ""
    },
    // 24. ESP32 BT Available
    {
      "type": "esp32_bluetooth_available",
      "message0": "Bluetooth Available?",
      "output": "Boolean",
      "colour": "#00B0FF",
      "tooltip": "Check if Bluetooth data is available to read",
      "helpUrl": ""
    },
    // 25. ESP32 BT Read
    {
      "type": "esp32_bluetooth_read",
      "message0": "Bluetooth Read Byte",
      "output": "Number",
      "colour": "#00B0FF",
      "tooltip": "Read byte from Bluetooth Serial connection",
      "helpUrl": ""
    },
    // 26. ESP32 BT Write
    {
      "type": "esp32_bluetooth_write",
      "message0": "Bluetooth Write %1",
      "args0": [
        { "type": "input_value", "name": "DATA" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#00B0FF",
      "tooltip": "Write value or character to Bluetooth Serial link",
      "helpUrl": ""
    },
    // 27. ESP32 Touch Read
    {
      "type": "esp32_touch_read",
      "message0": "Read Touch on Pin %1",
      "args0": [
        { "type": "field_number", "name": "PIN", "value": 4 }
      ],
      "output": "Number",
      "colour": "#00E676",
      "tooltip": "Read capacitive touch value from ESP32 touch pin",
      "helpUrl": ""
    },
    // 28. ESP32 Hall Read
    {
      "type": "esp32_hall_read",
      "message0": "Read Hall Magnetic Sensor",
      "output": "Number",
      "colour": "#00E676",
      "tooltip": "Read the ESP32 internal magnetic Hall effect sensor",
      "helpUrl": ""
    },
    // 29. DHT Init
    {
      "type": "dht_init",
      "message0": "Initialize DHT Pin %1 Type %2",
      "args0": [
        { "type": "field_input", "name": "PIN", "text": "D2" },
        {
          "type": "field_dropdown",
          "name": "TYPE",
          "options": [
            ["DHT11", "DHT11"],
            ["DHT22", "DHT22"]
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#06B6D4",
      "tooltip": "Initialize DHT11 or DHT22 sensor on a digital pin",
      "helpUrl": ""
    },
    // 30. DHT Read Temp
    {
      "type": "dht_read_temp",
      "message0": "DHT Read Temperature (°C)",
      "output": "Number",
      "colour": "#06B6D4",
      "tooltip": "Read temperature value in Celsius from DHT sensor",
      "helpUrl": ""
    },
    // 31. DHT Read Humi
    {
      "type": "dht_read_humi",
      "message0": "DHT Read Humidity (%)",
      "output": "Number",
      "colour": "#06B6D4",
      "tooltip": "Read humidity percentage from DHT sensor",
      "helpUrl": ""
    },
    // 32. MPU6050 Init
    {
      "type": "mpu6050_init",
      "message0": "Initialize MPU6050 IMU",
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#8B5CF6",
      "tooltip": "Initialize MPU6050 Accelerometer & Gyroscope",
      "helpUrl": ""
    },
    // 33. MPU6050 Read
    {
      "type": "mpu6050_read",
      "message0": "MPU6050 Read %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "VAL",
          "options": [
            ["Accel X", "ACCEL_X"],
            ["Accel Y", "ACCEL_Y"],
            ["Accel Z", "ACCEL_Z"],
            ["Gyro X", "GYRO_X"],
            ["Gyro Y", "GYRO_Y"],
            ["Gyro Z", "GYRO_Z"]
          ]
        }
      ],
      "output": "Number",
      "colour": "#8B5CF6",
      "tooltip": "Read Accelerometer or Gyroscope axis value from MPU6050",
      "helpUrl": ""
    },
    // 34. NeoPixel Init
    {
      "type": "neopixel_init",
      "message0": "Initialize NeoPixel Pin %1 NumPixels %2",
      "args0": [
        { "type": "field_number", "name": "PIN", "value": 5 },
        { "type": "field_number", "name": "NUM", "value": 8 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#EC4899",
      "tooltip": "Initialize Adafruit NeoPixel strip",
      "helpUrl": ""
    },
    // 35. NeoPixel Set Color
    {
      "type": "neopixel_set_color",
      "message0": "NeoPixel Set Pixel %1 Color R %2 G %3 B %4",
      "args0": [
        { "type": "input_value", "name": "INDEX" },
        { "type": "input_value", "name": "R" },
        { "type": "input_value", "name": "G" },
        { "type": "input_value", "name": "B" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#EC4899",
      "tooltip": "Set single pixel color",
      "helpUrl": ""
    },
    // 36. NeoPixel Show
    {
      "type": "neopixel_show",
      "message0": "NeoPixel Show / Update",
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#EC4899",
      "tooltip": "Push color changes to the NeoPixel strip",
      "helpUrl": ""
    },
    // 37. MQTT Init
    {
      "type": "mqtt_init",
      "message0": "Initialize MQTT Client",
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#10B981",
      "tooltip": "Initialize WiFiClient and PubSubClient client wrappers",
      "helpUrl": ""
    },
    // 38. MQTT Connect
    {
      "type": "mqtt_connect",
      "message0": "MQTT Connect Server %1 Port %2 ClientID %3",
      "args0": [
        { "type": "input_value", "name": "SERVER" },
        { "type": "input_value", "name": "PORT" },
        { "type": "input_value", "name": "CLIENT_ID" }
      ],
      "output": "Boolean",
      "colour": "#10B981",
      "tooltip": "Connect MQTT Client to server broker",
      "helpUrl": ""
    },
    // 39. MQTT Publish
    {
      "type": "mqtt_publish",
      "message0": "MQTT Publish Topic %1 Msg %2",
      "args0": [
        { "type": "input_value", "name": "TOPIC" },
        { "type": "input_value", "name": "MSG" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#10B981",
      "tooltip": "Publish message to an MQTT topic",
      "helpUrl": ""
    },
    // 40. MQTT Subscribe
    {
      "type": "mqtt_subscribe",
      "message0": "MQTT Subscribe Topic %1",
      "args0": [
        { "type": "input_value", "name": "TOPIC" }
      ],
      "previousStatement": null,
      "tooltip": "Subscribe to an MQTT topic",
      "helpUrl": ""
    }
  ]);
} catch (e) {
  // Blocks already defined or error
}

// Define custom micro:bit blocks
try {
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "basic_on_start",
      "message0": "on start",
      "message1": "%1",
      "args1": [
        { "type": "input_statement", "name": "HANDLER" }
      ],
      "colour": "#2AC1BC",
      "tooltip": "Runs once at program start"
    },
    {
      "type": "basic_forever",
      "message0": "forever",
      "message1": "%1",
      "args1": [
        { "type": "input_statement", "name": "HANDLER" }
      ],
      "colour": "#2AC1BC",
      "tooltip": "Runs continuously in a loop"
    },
    {
      "type": "basic_show_string",
      "message0": "show string %1",
      "args0": [
        { "type": "input_value", "name": "TEXT", "check": "String" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#2AC1BC",
      "tooltip": "Show text on the LED display"
    },
    {
      "type": "basic_show_number",
      "message0": "show number %1",
      "args0": [
        { "type": "input_value", "name": "NUMBER", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#2AC1BC",
      "tooltip": "Show a number on the LED display"
    },
    {
      "type": "basic_show_icon",
      "message0": "show icon %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "ICON",
          "options": [
            ["Heart", "Heart"],
            ["Smile", "Smile"],
            ["Sad", "Sad"],
            ["Confused", "Confused"],
            ["Yes", "Yes"],
            ["No", "No"]
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#2AC1BC",
      "tooltip": "Show an icon on the LED display"
    },
    {
      "type": "basic_clear_screen",
      "message0": "clear screen",
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#2AC1BC",
      "tooltip": "Clear the LED display"
    },
    {
      "type": "basic_pause",
      "message0": "pause (ms) %1",
      "args0": [
        { "type": "input_value", "name": "MS", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#2AC1BC",
      "tooltip": "Pause for a number of milliseconds"
    },
    {
      "type": "input_on_button_pressed",
      "message0": "on button %1 pressed",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "BUTTON",
          "options": [["A", "A"], ["B", "B"]]
        }
      ],
      "message1": "%1",
      "args1": [
        { "type": "input_statement", "name": "HANDLER" }
      ],
      "colour": "#12B886",
      "tooltip": "Run code when a button is pressed"
    },
    {
      "type": "input_button_is_pressed",
      "message0": "button %1 is pressed",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "BUTTON",
          "options": [["A", "A"], ["B", "B"]]
        }
      ],
      "output": "Boolean",
      "colour": "#12B886",
      "tooltip": "Check if a button is currently pressed"
    },
    {
      "type": "input_temperature",
      "message0": "temperature (°C)",
      "output": "Number",
      "colour": "#12B886",
      "tooltip": "Read the internal temperature sensor"
    },
    {
      "type": "input_light_level",
      "message0": "light level",
      "output": "Number",
      "colour": "#12B886",
      "tooltip": "Read the light intensity level"
    },
    {
      "type": "input_compass_heading",
      "message0": "compass heading (°)",
      "output": "Number",
      "colour": "#12B886",
      "tooltip": "Read the compass heading direction"
    },
    {
      "type": "input_on_gesture",
      "message0": "on %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "GESTURE",
          "options": [["shake", "shake"]]
        }
      ],
      "message1": "%1",
      "args1": [
        { "type": "input_statement", "name": "HANDLER" }
      ],
      "colour": "#12B886",
      "tooltip": "Run code when a gesture is detected"
    },
    {
      "type": "music_play_tone",
      "message0": "play tone %1 for (ms) %2",
      "args0": [
        { "type": "input_value", "name": "NOTE", "check": "Number" },
        { "type": "input_value", "name": "DURATION", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#E286F2",
      "tooltip": "Play a tone at a given frequency"
    },
    {
      "type": "radio_send_number",
      "message0": "radio send number %1",
      "args0": [
        { "type": "input_value", "name": "NUM", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#74C0FC",
      "tooltip": "Send a number via radio signal"
    },
    {
      "type": "pins_digital_write",
      "message0": "digital write pin %1 to %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PIN",
          "options": [["P0", "P0"], ["P1", "P1"], ["P2", "P2"]]
        },
        { "type": "input_value", "name": "VALUE", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#4a90e2",
      "tooltip": "Write HIGH or LOW to a pin"
    },
    {
      "type": "pins_analog_write",
      "message0": "analog write pin %1 to %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PIN",
          "options": [["P0", "P0"], ["P1", "P1"], ["P2", "P2"]]
        },
        { "type": "input_value", "name": "VALUE", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#4a90e2",
      "tooltip": "Write an analog (PWM) value to a pin"
    },
    {
      "type": "pins_digital_read",
      "message0": "digital read pin %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PIN",
          "options": [["P0", "P0"], ["P1", "P1"], ["P2", "P2"]]
        }
      ],
      "output": "Number",
      "colour": "#4a90e2",
      "tooltip": "Read the digital state of a pin"
    },
    {
      "type": "pins_analog_read",
      "message0": "analog read pin %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PIN",
          "options": [["P0", "P0"], ["P1", "P1"], ["P2", "P2"]]
        }
      ],
      "output": "Number",
      "colour": "#4a90e2",
      "tooltip": "Read the analog value of a pin"
    },
    {
      "type": "pins_servo_write",
      "message0": "servo write pin %1 to %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PIN",
          "options": [["P0", "P0"], ["P1", "P1"], ["P2", "P2"]]
        },
        { "type": "input_value", "name": "VALUE", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#4a90e2",
      "tooltip": "Set the servo motor angle on a pin"
    }
  ]);

  // Programmatically register basic_show_leds with its 5x5 checkbox fields
  if (!Blockly.Blocks['basic_show_leds']) {
    Blockly.Blocks['basic_show_leds'] = {
      init: function () {
        this.appendDummyInput().appendField("show LED");
        for (let r = 0; r < 5; r++) {
          const input = this.appendDummyInput();
          for (let c = 0; c < 5; c++) {
            input.appendField(new Blockly.FieldCheckbox("FALSE"), `LED${c}${r}`);
          }
        }
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#2AC1BC');
        this.setTooltip("Show a pattern on the LED grid");
      }
    };
  }
} catch (e) {
  console.warn("Microbit custom blocks register error:", e);
}

// ─── Library Signature Database ────────────────────────────────────────────
// Maps library name patterns to block definitions + toolbox XML.
// Used to auto-generate Blockly blocks when a library is installed from GitHub.
const LIBRARY_SIGNATURES: Array<{
  patterns: string[];
  categoryName: string;
  colour: string;
  blocks: Array<{ type: string; message: string; inputs?: any[]; isStatement?: boolean; isValue?: boolean }>;
}> = [
  {
    patterns: ['tft', 'ili9', 'st7', 'ssd1', 'oled', 'display', 'lcd', 'screen'],
    categoryName: 'Display',
    colour: '#f2c94c',
    blocks: [
      { type: 'lib_display_begin',   message: 'Display Begin',              isStatement: true },
      { type: 'lib_display_clear',   message: 'Display Clear',              isStatement: true },
      { type: 'lib_display_print',   message: 'Display Print %1',           inputs: [{ name: 'TEXT', type: 'input_value' }], isStatement: true },
      { type: 'lib_display_setcursor', message: 'Display Set Cursor X %1 Y %2', inputs: [{ name: 'X', type: 'field_number', value: 0 }, { name: 'Y', type: 'field_number', value: 0 }], isStatement: true },
    ],
  },
  {
    patterns: ['fastled', 'crgb', 'ledstrip', 'ws2812', 'sk6812'],
    categoryName: 'FastLED',
    colour: '#eb5757',
    blocks: [
      { type: 'lib_fastled_begin',   message: 'FastLED AddLeds Pin %1 Count %2', inputs: [{ name: 'PIN', type: 'field_number', value: 5 }, { name: 'NUM', type: 'field_number', value: 60 }], isStatement: true },
      { type: 'lib_fastled_show',    message: 'FastLED Show',               isStatement: true },
      { type: 'lib_fastled_setrgb',  message: 'FastLED Set LED %1 R %2 G %3 B %4', inputs: [{ name: 'IDX', type: 'field_number', value: 0 }, { name: 'R', type: 'field_number', value: 255 }, { name: 'G', type: 'field_number', value: 0 }, { name: 'B', type: 'field_number', value: 0 }], isStatement: true },
      { type: 'lib_fastled_brightness', message: 'FastLED Brightness %1', inputs: [{ name: 'VAL', type: 'field_number', value: 128 }], isStatement: true },
    ],
  },
  {
    patterns: ['stepper', 'motor', 'l298', 'l293', 'drv8825', 'a4988', 'accelstepper'],
    categoryName: 'Stepper Motor',
    colour: '#27ae60',
    blocks: [
      { type: 'lib_stepper_begin',  message: 'Stepper Setup Steps %1 Pin1 %2 Pin2 %3', inputs: [{ name: 'STEPS', type: 'field_number', value: 200 }, { name: 'P1', type: 'field_number', value: 8 }, { name: 'P2', type: 'field_number', value: 9 }], isStatement: true },
      { type: 'lib_stepper_setspeed', message: 'Stepper SetSpeed %1 RPM', inputs: [{ name: 'SPD', type: 'field_number', value: 100 }], isStatement: true },
      { type: 'lib_stepper_step',   message: 'Stepper Move %1 steps',      inputs: [{ name: 'N', type: 'field_number', value: 100 }], isStatement: true },
    ],
  },
  {
    patterns: ['sd', 'sdcard', 'sd_fat', 'fatfs'],
    categoryName: 'SD Card',
    colour: '#219653',
    blocks: [
      { type: 'lib_sd_begin',  message: 'SD Begin CS Pin %1', inputs: [{ name: 'PIN', type: 'field_number', value: 5 }], isStatement: true },
      { type: 'lib_sd_open',   message: 'SD Open File %1',    inputs: [{ name: 'NAME', type: 'input_value' }], isStatement: true },
      { type: 'lib_sd_write',  message: 'SD Write %1',        inputs: [{ name: 'DATA', type: 'input_value' }], isStatement: true },
      { type: 'lib_sd_close',  message: 'SD Close File',      isStatement: true },
    ],
  },
  {
    patterns: ['bmp', 'bme280', 'bme680', 'lps', 'pressure', 'barometer'],
    categoryName: 'Pressure Sensor',
    colour: '#9b51e0',
    blocks: [
      { type: 'lib_bme_begin',    message: 'Pressure Sensor Begin',           isStatement: true },
      { type: 'lib_bme_temp',     message: 'Read Temperature (°C)',            isValue: true },
      { type: 'lib_bme_pressure', message: 'Read Pressure (hPa)',              isValue: true },
      { type: 'lib_bme_humidity', message: 'Read Humidity (%)',                isValue: true },
    ],
  },
  {
    patterns: ['gps', 'nmea', 'tinygps', 'neo6', 'neo7', 'neo8'],
    categoryName: 'GPS',
    colour: '#2f80ed',
    blocks: [
      { type: 'lib_gps_begin',   message: 'GPS Begin Baud %1', inputs: [{ name: 'BAUD', type: 'field_number', value: 9600 }], isStatement: true },
      { type: 'lib_gps_lat',     message: 'GPS Latitude',      isValue: true },
      { type: 'lib_gps_lng',     message: 'GPS Longitude',     isValue: true },
      { type: 'lib_gps_speed',   message: 'GPS Speed (km/h)',  isValue: true },
    ],
  },
  {
    patterns: ['rfid', 'mfrc522', 'pn532', 'nfc'],
    categoryName: 'RFID / NFC',
    colour: '#56ccf2',
    blocks: [
      { type: 'lib_rfid_i2c_begin',  message: 'RFID Begin (I2C) SDA Pin %1 SCL Pin %2', inputs: [{ name: 'SDA', type: 'field_input', text: 'D2' }, { name: 'SCL', type: 'field_input', text: 'D1' }], isStatement: true },
      { type: 'lib_rfid_begin',      message: 'RFID Begin IRQ Pin %1 Reset Pin %2', inputs: [{ name: 'IRQ', type: 'field_input', text: 'D2' }, { name: 'RESET', type: 'field_input', text: 'D3' }], isStatement: true },
      { type: 'lib_rfid_print_uid',  message: 'RFID Print UID on Card Detected', isStatement: true },
      { type: 'lib_rfid_read',       message: 'RFID Read Card UID (Hex String)', isValue: true },
      { type: 'lib_rfid_iscard',     message: 'RFID Is Card Present?',     isValue: true },
    ],
  },
  {
    patterns: ['keypad', 'keyboard', 'matrix4x4', '4x4', '3x4'],
    categoryName: 'Keypad',
    colour: '#f2994a',
    blocks: [
      { type: 'lib_keypad_begin', message: 'Keypad Begin',         isStatement: true },
      { type: 'lib_keypad_read',  message: 'Keypad Read Key',      isValue: true },
    ],
  },
];

// Register Blockly block definitions for a given library signature on demand.
// Safe to call multiple times — duplicate types are skipped.
function registerLibraryBlocks(sig: typeof LIBRARY_SIGNATURES[0]) {
  const newDefs: any[] = [];
  sig.blocks.forEach(bd => {
    if (Blockly.Blocks[bd.type]) return; // already registered
    const def: any = {
      type: bd.type,
      message0: bd.message,
      colour: sig.colour,
      tooltip: bd.message,
      helpUrl: '',
    };
    if (bd.inputs && bd.inputs.length > 0) {
      def.args0 = bd.inputs.map(inp => {
        if (inp.type === 'input_value') {
          return { type: 'input_value', name: inp.name };
        }
        if (inp.type === 'field_input') {
          return { type: 'field_input', name: inp.name, text: inp.text ?? 'D2' };
        }
        return { type: 'field_number', name: inp.name, value: inp.value ?? 0 };
      });
    }
    if (bd.isStatement) {
      def.previousStatement = null;
      def.nextStatement = null;
    } else if (bd.isValue) {
      def.output = 'Number';
    }
    newDefs.push(def);
  });
  if (newDefs.length > 0) {
    try { Blockly.defineBlocksWithJsonArray(newDefs); } catch (_) {}
  }
}

// Pre-register all built-in signature blocks at load time & disable native Blockly 8px left border bar
try {
  if ((Blockly as any).ToolboxCategory) {
    (Blockly as any).ToolboxCategory.borderWidth = 0;
  }
  LIBRARY_SIGNATURES.forEach(sig => registerLibraryBlocks(sig));
} catch (e) {
  console.warn("Library signatures pre-registration warning:", e);
}

interface BlocklyEditorProps {
  codeType: 'arduino' | 'python';
  board?: string;
  onCodeChange: (code: string, otherCode?: string) => void;
  onCollapse?: () => void;
  installedLibraries?: string[];
  isSyncWithBlocks?: boolean;
  workspaceXml?: string | null;
  onWorkspaceChange?: (xmlText: string) => void;
  activeFile?: string;
  isRunning?: boolean;
  onRunSimulator?: (code: string) => void;
  onStopSimulator?: () => void;
  onSyncToCode?: (arduinoCode: string, pythonCode: string) => void;
  themeMode?: 'dark' | 'light';
  onMicrobitPreview?: (frames: string[]) => void;
  compact?: boolean;
  robotHardwareConfig?: RobotHardwareConfig;
  activeRobotHighlight?: ActiveExecutionHighlight;
  onRobotPlansExtracted?: (
    plans: RobotPlan[],
    activePlanId: number,
    hwPatch?: Partial<RobotHardwareConfig>
  ) => void;
}

const getBlockTypesForLibrary = (libName: string): string[] => {
  const lower = libName.toLowerCase();
  
  // 1. Hardcoded libraries
  if (lower.includes('rfid') || lower.includes('pn532') || lower.includes('mfrc522') || lower.includes('nfc')) {
    return ['lib_rfid_begin', 'lib_rfid_i2c_begin', 'lib_rfid_print_uid', 'lib_rfid_read', 'lib_rfid_iscard'];
  }
  if (lower.includes('dht')) {
    return ['dht_init', 'dht_read_temp', 'dht_read_humi'];
  }
  if (lower.includes('mpu6050') || lower.includes('mpu_6050')) {
    return ['mpu6050_init', 'mpu6050_read'];
  }
  if (lower.includes('neopixel') || lower.includes('neo_pixel')) {
    return ['neopixel_init', 'neopixel_set_color', 'neopixel_show'];
  }
  if (lower.includes('mqtt') || lower.includes('pubsub')) {
    return ['mqtt_init', 'mqtt_connect', 'mqtt_publish', 'mqtt_subscribe'];
  }
  if (lower.includes('servo')) {
    return ['arduino_servo_write'];
  }
  if (lower.includes('ultrasonic') || lower.includes('hcsr04') || lower.includes('hc_sr04')) {
    return ['sensor_ultrasonic'];
  }
  if (lower.includes('irremote') || lower.includes('ir_remote') || lower.includes('infrared')) {
    return ['arduino_serial_available', 'arduino_serial_read'];
  }
  
  // 2. Dynamic LIBRARY_SIGNATURES scan
  const sig = LIBRARY_SIGNATURES.find(s => s.patterns.some(pat => lower.includes(pat)));
  if (sig) {
    return sig.blocks.map(b => b.type);
  }
  
  // 3. Unknown/GitHub libraries
  const safeName = libName.replace(/[^a-zA-Z0-9_\-]/g, '');
  return [
    `custom_${safeName}_begin`.toLowerCase(),
    `custom_${safeName}_read`.toLowerCase(),
    `custom_${safeName}_print`.toLowerCase()
  ];
};

/**
 * Checks whether a block is active (not disabled) and connected to a valid
 * root execution structure (setup, loop, function, event handler, container).
 * Disconnected / floating / orphaned blocks return false so they are ignored.
 */
export const isBlockActive = (block: any): boolean => {
  if (!block) return false;

  // 1. Check if this block itself is disabled
  if (block.disabled || (typeof block.isEnabled === 'function' && !block.isEnabled())) {
    return false;
  }

  // 2. Check if this block is inside a flyout
  if (block.workspace?.isFlyout) {
    return false;
  }

  // 3. Walk up the parent chain to verify that every ancestor is enabled
  let cur: any = block;
  while (cur) {
    if (cur.disabled || (typeof cur.isEnabled === 'function' && !cur.isEnabled())) {
      return false;
    }
    const parent = cur.getParent();
    if (!parent) break;
    cur = parent;
  }

  // 4. `cur` is now the root block (top-level block) of the chain.
  if (!cur) return false;

  // 5. Recognized executable root blocks:
  const validRootTypes = new Set([
    'arduino_setup',
    'arduino_loop',
    'procedures_defnoreturn',
    'procedures_defreturn',
    'blynk_on_write',
    'basic_on_start',
    'basic_forever',
    'input_on_button_pressed',
    'input_on_gesture',
    'robot_plan_container',
    'robot_run_plan',
  ]);

  if (validRootTypes.has(cur.type)) {
    return true;
  }

  // robot_hw_setup is valid at top level if there is a robot_plan_container or robot_run_plan
  if (cur.type === 'robot_hw_setup') {
    const ws = cur.workspace;
    return !!ws && ws.getAllBlocks(false).some((b: any) => 
      (b.type === 'robot_plan_container' || b.type === 'robot_run_plan') &&
      !b.disabled &&
      (typeof b.isEnabled !== 'function' || b.isEnabled())
    );
  }

  return false;
};

const isLibraryNeeded = (libName: string, workspace: any): boolean => {
  const lower = libName.toLowerCase();
  
  if (lower === 'wire') {
    const hasMPU = workspace.getBlocksByType('mpu6050_init').some((b: any) => isBlockActive(b)) ||
                   workspace.getBlocksByType('mpu6050_read').some((b: any) => isBlockActive(b));
    const hasDisplay = workspace.getBlocksByType('lib_display_begin').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('lib_display_clear').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('lib_display_print').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('lib_display_setcursor').some((b: any) => isBlockActive(b));
    const hasRFID = workspace.getAllBlocks(false).some((b: any) => isBlockActive(b) && ((b.type || '').toLowerCase().includes('rfid') || (b.type || '').toLowerCase().includes('pn532')));
    return hasMPU || hasDisplay || hasRFID;
  }
  
  if (lower === 'spi') {
    const hasSPI_RFID = workspace.getBlocksByType('lib_rfid_begin').some((b: any) => isBlockActive(b));
    return hasSPI_RFID;
  }

  if (lower === 'robolab_core' || lower === 'robolab') {
    return false;
  }

  const blockTypes = getBlockTypesForLibrary(libName);
  if (blockTypes.length === 0) return false;
  
  return blockTypes.some(type => workspace.getBlocksByType(type).some((b: any) => isBlockActive(b))) ||
         workspace.getAllBlocks(false).some((b: any) => isBlockActive(b) && ((b.type || '').toLowerCase().includes('rfid') || (b.type || '').toLowerCase().includes('pn532')));
};

export const BlocklyEditor: React.FC<BlocklyEditorProps> = ({
  codeType,
  board = '',
  onCodeChange,

  installedLibraries = [],
  isSyncWithBlocks = true,
  workspaceXml = null,
  onWorkspaceChange,
  activeFile,
  isRunning = false,
  onRunSimulator,
  onStopSimulator,
  onSyncToCode,
  themeMode = 'dark',
  onMicrobitPreview,
  compact = false,
  robotHardwareConfig,
  activeRobotHighlight,
  onRobotPlansExtracted,
}) => {
  const onWorkspaceChangeRef = useRef(onWorkspaceChange);
  onWorkspaceChangeRef.current = onWorkspaceChange;

  const onCodeChangeRef = useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;

  const onMicrobitPreviewRef = useRef(onMicrobitPreview);
  onMicrobitPreviewRef.current = onMicrobitPreview;

  const onRobotPlansExtractedRef = useRef(onRobotPlansExtracted);
  onRobotPlansExtractedRef.current = onRobotPlansExtracted;

  const robotHwRef = useRef<RobotHardwareConfig>(
    robotHardwareConfig || createDefaultRobotHardwareConfig()
  );
  if (robotHardwareConfig) {
    robotHwRef.current = robotHardwareConfig;
    activeRobotHwConfig = robotHardwareConfig;
  }

  const isSyncWithBlocksRef = useRef(isSyncWithBlocks);
  isSyncWithBlocksRef.current = isSyncWithBlocks;
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const installedLibrariesRef = useRef(installedLibraries);
  installedLibrariesRef.current = installedLibraries;

  const updateCodeRef = useRef<(() => void) | null>(null);
  const lastLoadedXmlRef = useRef<string | null>(null);
  const isLoadingXmlRef = useRef(false);
  const latestCodeRef = useRef<string>('');
  const generatedXmlsRef = useRef<Set<string>>(new Set());
  // boardRef & codeTypeRef: selalu sinkron dengan prop terbaru untuk menghindari stale closure & re-mount saat pindah tab C++/Python
  const boardRef = useRef<string>(board);
  boardRef.current = board;
  const codeTypeRef = useRef<'arduino' | 'python'>(codeType);
  codeTypeRef.current = codeType;

  const [searchQuery, setSearchQuery] = React.useState("");

  // Inject CSS for Live Glowing Block Animation when Robot Simulator runs
  useEffect(() => {
    if (!document.getElementById('robolab-running-block-glow-css')) {
      const style = document.createElement('style');
      style.id = 'robolab-running-block-glow-css';
      style.textContent = `
        @keyframes robolabBlockPulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.95)) drop-shadow(0 0 22px rgba(56, 189, 248, 0.85)) brightness(1.18);
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(250, 204, 21, 1)) drop-shadow(0 0 32px rgba(34, 197, 94, 0.95)) brightness(1.32);
          }
        }
        @keyframes robolabBlockStopGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(239, 68, 68, 1)) drop-shadow(0 0 26px rgba(249, 115, 22, 0.9)) brightness(1.22);
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(244, 63, 94, 1)) drop-shadow(0 0 34px rgba(239, 68, 68, 1)) brightness(1.38);
          }
        }
        .robolab-block-running-active > .blocklyPath {
          stroke: #fde047 !important;
          stroke-width: 4px !important;
        }
        .robolab-block-running-active {
          animation: robolabBlockPulseGlow 0.85s ease-in-out infinite !important;
        }
        .robolab-block-stopped-active > .blocklyPath {
          stroke: #f87171 !important;
          stroke-width: 4px !important;
        }
        .robolab-block-stopped-active {
          animation: robolabBlockStopGlow 0.75s ease-in-out infinite !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Apply / update live glowing highlight on the currently executing Robot Plan Step block
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const allBlocks = ws.getAllBlocks(false);
    allBlocks.forEach((b) => {
      const svg = b.getSvgRoot();
      if (svg) {
        svg.classList.remove('robolab-block-running-active', 'robolab-block-stopped-active');
      }
    });

    if (!activeRobotHighlight || !activeRobotHighlight.running) return;

    let targetBlock: Blockly.Block | null = null;
    if (activeRobotHighlight.blockId) {
      targetBlock = ws.getBlockById(activeRobotHighlight.blockId);
    }
    if (!targetBlock && activeRobotHighlight.stepIndex !== null) {
      targetBlock =
        allBlocks.find(
          (b) =>
            b.type === 'robot_plan_step' &&
            Number(b.getFieldValue('INDEX')) === activeRobotHighlight.stepIndex
        ) || null;
    }

    if (targetBlock) {
      const svg = targetBlock.getSvgRoot();
      if (svg) {
        svg.classList.add(
          activeRobotHighlight.stoppedByInterrupt
            ? 'robolab-block-stopped-active'
            : 'robolab-block-running-active'
        );
      }
    }
  }, [activeRobotHighlight]);

  // Normalize sensor pattern length on existing robot_plan_step blocks when sensorCount changes
  useEffect(() => {
    if (!robotHardwareConfig) return;
    activeRobotHwConfig = robotHardwareConfig;
    const ws = workspaceRef.current;
    if (!ws) return;
    const stepBlocks = ws.getBlocksByType('robot_plan_step', false);
    stepBlocks.forEach((b) => {
      const curPat = b.getFieldValue('PATTERN') || '';
      const norm = normalizeSensorPattern(curPat, robotHardwareConfig.sensorCount);
      if (curPat !== norm) {
        b.setFieldValue(norm, 'PATTERN');
      }
      const matched = findMatchingSensorPreset(norm, robotHardwareConfig.sensorCount);
      b.setFieldValue(matched ? norm : 'CUSTOM', 'SENSOR_PRESET');
      if (!robotHardwareConfig.hasEncoder) {
        if (b.getFieldValue('TRIG_UNIT') !== 'ms') b.setFieldValue('ms', 'TRIG_UNIT');
        if (b.getFieldValue('TIMER_UNIT') !== 'ms') b.setFieldValue('ms', 'TIMER_UNIT');
      }
    });
    if (isSyncWithBlocksRef.current && updateCodeRef.current) {
      updateCodeRef.current();
    }
  }, [
    robotHardwareConfig?.sensorCount,
    robotHardwareConfig?.hasEncoder,
    robotHardwareConfig?.motorRpm,
    robotHardwareConfig?.mcu,
    robotHardwareConfig?.sensorMode,
    JSON.stringify(robotHardwareConfig?.pids),
    JSON.stringify(robotHardwareConfig?.pins),
  ]);

  const CAT_ICON_CONFIG: Record<string, { color: string; rgb: string; section: string; svg: string }> = {
    'cat-robot-plan': { color: '#f97316', rgb: '249, 115, 22', section: 'ROBOTICS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><rect x="4" y="8" width="16" height="12" rx="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/></svg>` },
    'cat-logic':      { color: '#4c97ff', rgb: '76, 151, 255', section: 'CORE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>` },
    'cat-loop':       { color: '#ffab19', rgb: '255, 171, 25', section: 'CORE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>` },
    'cat-math':       { color: '#40bf4a', rgb: '64, 191, 74', section: 'CORE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>` },
    'cat-text':       { color: '#26c6da', rgb: '38, 198, 218', section: 'CORE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>` },
    'cat-variables':  { color: '#ff8c1a', rgb: '255, 140, 26', section: 'CORE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>` },
    'cat-functions':  { color: '#ff6680', rgb: '255, 102, 128', section: 'CORE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>` },
    'cat-io':         { color: '#9966ff', rgb: '153, 102, 255', section: 'SYSTEM', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>` },
    'cat-time':       { color: '#f43f5e', rgb: '244, 63, 94', section: 'SYSTEM', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
    'cat-arduino':    { color: '#14b8a6', rgb: '20, 184, 166', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>` },
    'cat-esp32':      { color: '#10b981', rgb: '16, 185, 129', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><rect x="6" y="6" width="12" height="12" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 6h3M1 9h3m-3 6h3"/></svg>` },
    'cat-bluetooth':  { color: '#3b82f6', rgb: '59, 130, 246', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17l10-10-5-5v20l5-5L7 7"/></svg>` },
    'cat-servo':      { color: '#f97316', rgb: '249, 115, 22', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3"/></svg>` },
    'cat-motor':      { color: '#22c55e', rgb: '34, 197, 94', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>` },
    'cat-servo-motor':{ color: '#f97316', rgb: '249, 115, 22', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3"/></svg>` },
    'cat-sensor':     { color: '#a855f7', rgb: '168, 85, 247', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>` },
    'cat-display':    { color: '#f59e0b', rgb: '245, 158, 11', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>` },
    'cat-iot':        { color: '#0ea5e9', rgb: '14, 165, 233', section: 'HARDWARE', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>` },
    'cat-microbit':   { color: '#14b8a6', rgb: '20, 184, 166', section: 'MICRO:BIT', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="8" cy="12" r="1.5" fill="white"/><circle cx="12" cy="12" r="1.5" fill="white"/><circle cx="16" cy="12" r="1.5" fill="white"/></svg>` },
    'cat-mb-basic':   { color: '#2ac1bc', rgb: '42, 193, 188', section: 'MICRO:BIT', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
    'cat-mb-input':   { color: '#12b886', rgb: '18, 184, 134', section: 'MICRO:BIT', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>` },
    'cat-mb-music':   { color: '#e286f2', rgb: '226, 134, 242', section: 'MICRO:BIT', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 10l12-3M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
    'cat-mb-radio':   { color: '#74c0fc', rgb: '116, 192, 252', section: 'MICRO:BIT', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 8a9 9 0 010 8M16 10a5 5 0 010 4M12 12a1 1 0 100-2 1 1 0 000 2z"/></svg>` },
    'cat-mb-pins':    { color: '#6366f1', rgb: '99, 102, 241', section: 'MICRO:BIT', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5v4a4 4 0 008 0V5M12 13v8M10 21h4"/></svg>` },
    'cat-dht':        { color: '#06b6d4', rgb: '6, 182, 212', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v10m0 0c-1.333 0-4 .8-4 4s2.667 4 4 4 4-.8 4-4-2.667-4-4-4z"/></svg>` },
    'cat-mpu':        { color: '#8b5cf6', rgb: '139, 92, 246', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M3 12h18m-3-3l3 3-3 3M6 9l-3 3 3 3"/></svg>` },
    'cat-neopixel':   { color: '#ec4899', rgb: '236, 72, 153', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>` },
    'cat-ir':         { color: '#f97316', rgb: '249, 115, 22', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>` },
    'cat-ultrasonic': { color: '#a855f7', rgb: '168, 85, 247', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 10l12-3M9 19a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
    'cat-rfid':       { color: '#06b6d4', rgb: '6, 182, 212', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><rect x="3" y="5" width="18" height="14" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h2m4 0h2"/></svg>` },
    'cat-sdcard':     { color: '#10b981', rgb: '16, 185, 129', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm2 3v3m3-3v3m3-3v3"/></svg>` },
    'cat-pressure':   { color: '#8b5cf6', rgb: '139, 92, 246', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 12l3.5-3.5M12 7v1m5 4h-1M7 12h1"/></svg>` },
    'cat-gps':        { color: '#3b82f6', rgb: '59, 130, 246', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
    'cat-keypad':     { color: '#f59e0b', rgb: '245, 158, 11', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><rect x="4" y="4" width="4" height="4" rx="1"/><rect x="10" y="4" width="4" height="4" rx="1"/><rect x="16" y="4" width="4" height="4" rx="1"/><rect x="4" y="10" width="4" height="4" rx="1"/><rect x="10" y="10" width="4" height="4" rx="1"/><rect x="16" y="10" width="4" height="4" rx="1"/><rect x="4" y="16" width="4" height="4" rx="1"/><rect x="10" y="16" width="4" height="4" rx="1"/><rect x="16" y="16" width="4" height="4" rx="1"/></svg>` },
    'cat-default':    { color: '#6366f1', rgb: '99, 102, 241', section: 'EXTENSIONS', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.3" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>` },
  };

  const getCatKey = (lowerText: string): string => {
    const t = lowerText.toLowerCase().trim();
    if (t.includes('robot plan') || t.includes('plan')) return 'cat-robot-plan';
    if (t.includes('logic')) return 'cat-logic';
    if (t.includes('loop')) return 'cat-loop';
    if (t.includes('math')) return 'cat-math';
    if (t.includes('text')) return 'cat-text';
    if (t.includes('variable')) return 'cat-variables';
    if (t.includes('func') || t.includes('fung')) return 'cat-functions';
    if (t.includes('keypad') || t.includes('keyboard')) return 'cat-keypad';
    if (t.includes('input') || t.includes('io') || t.includes('i/o')) return 'cat-io';
    if (t.includes('time') || t.includes('waktu')) return 'cat-time';
    if (t.includes('arduino')) return 'cat-arduino';
    if (t.includes('esp')) return 'cat-esp32';
    if (t.includes('bluetooth')) return 'cat-bluetooth';
    if (t.includes('servo')) return 'cat-servo';
    if (t.includes('motor') || t.includes('stepper')) return 'cat-motor';
    if (t.includes('dht')) return 'cat-dht';
    if (t.includes('mpu') || t.includes('imu')) return 'cat-mpu';
    if (t.includes('neo') || t.includes('fastled') || t.includes('led')) return 'cat-neopixel';
    if (t.includes('ir') || t.includes('infra') || t.includes('remote')) return 'cat-ir';
    if (t.includes('ultra')) return 'cat-ultrasonic';
    if (t.includes('rfid') || t.includes('nfc')) return 'cat-rfid';
    if (t.includes('display') || t.includes('screen') || t.includes('tft') || t.includes('oled') || t.includes('lcd')) return 'cat-display';
    if (t.includes('gps')) return 'cat-gps';
    if (t.includes('iot')) return 'cat-iot';
    if (t.includes('micro') || t.includes('mb')) return 'cat-microbit';
    if (t.includes('sd') || t.includes('card')) return 'cat-sdcard';
    if (t.includes('pressure') || t.includes('bmp') || t.includes('bme')) return 'cat-pressure';
    if (t.includes('sensor') || t.includes('sens')) return 'cat-sensor';
    return 'cat-default';
  };

  const isLightModeRef = React.useRef(false);

  const updateToolboxUI = useCallback(() => {
    const rootEl = blocklyDivRef.current;
    if (!rootEl) return;
    const isLight = isLightModeRef.current;
    const tbWidth = '215px';

    // Inject permanent global CSS to kill native Blockly tree icons & 8px border-left bars
    if (!document.getElementById('codekit-toolbox-kill-icons')) {
      const killStyle = document.createElement('style');
      killStyle.id = 'codekit-toolbox-kill-icons';
      killStyle.textContent = `
        .blocklyTreeIcon, .blocklyTreeIconNone, .blocklyToolboxCategoryIcon, [class*="TreeIcon"] { display: none !important; width: 0 !important; height: 0 !important; min-width: 0 !important; border: none !important; border-left: none !important; visibility: hidden !important; opacity: 0 !important; }
        .blocklyTreeRow::before, .blocklyToolboxCategory::before { display: none !important; content: none !important; }
        .blocklyToolboxDiv [role="treeitem"] > div:not(.codekit-icon-box):not(.cat-active-bar) { border: none !important; border-left: none !important; background: transparent !important; background-color: transparent !important; padding: 0 !important; margin: 0 !important; }
        .blocklyTreeSelected .blocklyTreeLabel, .blocklyToolboxCategorySelected .blocklyToolboxCategoryLabel { background: transparent !important; background-color: transparent !important; border-left: none !important; }
        .blocklyToolboxContents { overflow: visible !important; padding-bottom: 32px !important; }
        .blocklyToolboxDiv { overflow-x: hidden !important; overflow-y: auto !important; }
      `;
      document.head.appendChild(killStyle);
    }

    try {
      const toolboxDiv = rootEl.querySelector('.blocklyToolboxDiv') as HTMLElement | null;
      if (toolboxDiv) {
        toolboxDiv.style.setProperty('width', tbWidth, 'important');
        toolboxDiv.style.setProperty('min-width', tbWidth, 'important');
        toolboxDiv.style.setProperty('max-width', tbWidth, 'important');
        toolboxDiv.style.setProperty('box-sizing', 'border-box', 'important');
        toolboxDiv.style.setProperty('padding-top', '0px', 'important');
        toolboxDiv.style.setProperty('padding-bottom', '32px', 'important');
        toolboxDiv.style.setProperty('background-color', isLight ? '#f8fafc' : '#0b1120', 'important');
        toolboxDiv.style.setProperty('border-right', isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)', 'important');
        toolboxDiv.style.setProperty('box-shadow', 'none', 'important');
        toolboxDiv.style.setProperty('overflow-x', 'hidden', 'important');
        toolboxDiv.style.setProperty('overflow-y', 'auto', 'important');

        // Header element inside toolboxDiv
        let headerEl = toolboxDiv.querySelector('.codekit-toolbox-header') as HTMLElement | null;
        if (!headerEl) {
          headerEl = document.createElement('div');
          headerEl.className = 'codekit-toolbox-header';
          headerEl.innerHTML = `
            <div class="codekit-header-title">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="w-3.5 h-3.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>BLOCKS MENU</span>
            </div>
            <div class="codekit-search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="codekit-search-icon">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input type="text" class="codekit-search-input" placeholder="Cari blok..." />
            </div>
          `;
          toolboxDiv.insertBefore(headerEl, toolboxDiv.firstChild);

          const searchInput = headerEl.querySelector('.codekit-search-input') as HTMLInputElement | null;
          if (searchInput) {
            searchInput.addEventListener('input', (e) => {
              const val = (e.target as HTMLInputElement).value;
              setSearchQuery(val);
            });
          }
        }

        const searchInput = toolboxDiv.querySelector('.codekit-search-input') as HTMLInputElement | null;
        if (searchInput && searchInput.value !== searchQuery) {
          searchInput.value = searchQuery;
        }
      }

      const contentsEl = rootEl.querySelector('.blocklyToolboxContents') as HTMLElement | null;
      const effectiveRows = rootEl.querySelectorAll('[role="treeitem"]');

      const renderedSections = new Set<string>();

      effectiveRows.forEach((rowEl: Element) => {
        const row = rowEl as HTMLElement;

        // Strip any native Blockly 8px left color border on inner rowDiv_ / rowContents_
        row.querySelectorAll('div:not(.codekit-icon-box):not(.cat-active-bar)').forEach((innerDivEl) => {
          const innerDiv = innerDivEl as HTMLElement;
          if (innerDiv.getAttribute('role') === 'group') return;
          innerDiv.style.setProperty('border', 'none', 'important');
          innerDiv.style.setProperty('border-left', 'none', 'important');
          innerDiv.style.setProperty('background', 'transparent', 'important');
          innerDiv.style.setProperty('background-color', 'transparent', 'important');
          innerDiv.style.setProperty('padding', '0px', 'important');
          innerDiv.style.setProperty('margin', '0px', 'important');
          innerDiv.style.setProperty('display', 'flex', 'important');
          innerDiv.style.setProperty('align-items', 'center', 'important');
          innerDiv.style.setProperty('flex', '1', 'important');
          innerDiv.style.setProperty('min-width', '0', 'important');
        });

        let labelEl = row.querySelector('.blocklyTreeLabel, .blocklyToolboxCategoryLabel, .blocklyToolboxCategoryName, [id$=".label"]') as HTMLElement | null;
        if (!labelEl) {
          const spans = Array.from(row.querySelectorAll('span')).filter(s => 
            !s.classList.contains('blocklyTreeIcon') && 
            !s.classList.contains('blocklyToolboxCategoryIcon') && 
            !s.classList.contains('codekit-icon-box') &&
            !s.classList.contains('cat-active-bar') &&
            (s.textContent || '').trim().length > 0
          );
          if (spans.length > 0) {
            labelEl = spans[0] as HTMLElement;
          }
        }

        try {
          let cleanedText = row.getAttribute('data-cat-label') || '';
          if (!cleanedText) {
            const rawText = (labelEl ? labelEl.textContent : row.textContent) || '';
            // Use Extended_Pictographic instead of Emoji so digits (e.g. ESP32, MPU6050) are never stripped!
            cleanedText = rawText.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim();
            if (cleanedText) {
              row.setAttribute('data-cat-label', cleanedText);
            }
          }
          if (labelEl && cleanedText && labelEl.textContent !== cleanedText) {
            labelEl.textContent = cleanedText;
          }

          const lowerText = cleanedText.toLowerCase();
          const catKey = getCatKey(lowerText);
          const iconConf = CAT_ICON_CONFIG[catKey] || CAT_ICON_CONFIG['cat-default'];

          // Section header insertion
          const sectionName = iconConf.section;
          if (contentsEl && !renderedSections.has(sectionName) && sectionName && row.parentNode === contentsEl) {
            renderedSections.add(sectionName);
            let sectionHeader = contentsEl.querySelector(`.cat-section-header[data-section="${sectionName}"]`) as HTMLElement | null;
            if (!sectionHeader) {
              sectionHeader = document.createElement('div');
              sectionHeader.className = 'cat-section-header';
              sectionHeader.setAttribute('data-section', sectionName);
              sectionHeader.textContent = sectionName;
            }
            if (sectionHeader.parentNode !== contentsEl || row.previousElementSibling !== sectionHeader) {
              contentsEl.insertBefore(sectionHeader, row);
            }
          }

          const matches = !searchQuery || cleanedText.toLowerCase().includes(searchQuery.toLowerCase());
          if (searchQuery) {
            row.style.setProperty('display', matches ? 'flex' : 'none', 'important');
          } else {
            row.style.removeProperty('display');
          }

          if (searchQuery && !matches) return;

          const isSelected =
            row.classList.contains('blocklyTreeSelected') ||
            row.classList.contains('blocklyToolboxCategorySelected') ||
            row.getAttribute('aria-selected') === 'true' ||
            !!row.querySelector('.blocklyTreeSelected, .blocklyToolboxCategorySelected');

          row.style.setProperty('--cat-color', iconConf.color, 'important');
          row.style.setProperty('--cat-rgb', iconConf.rgb, 'important');

          // Kids-friendly colorful tactile card styling
          row.style.setProperty('display', 'flex', 'important');
          row.style.setProperty('align-items', 'center', 'important');
          row.style.setProperty('height', '42px', 'important');
          row.style.setProperty('min-height', '42px', 'important');
          row.style.setProperty('max-height', '42px', 'important');
          row.style.setProperty('padding', '0 10px 0 7px', 'important');
          row.style.setProperty('margin', '5px 10px', 'important');
          row.style.setProperty('border-radius', '12px', 'important');
          row.style.setProperty('cursor', 'pointer', 'important');
          row.style.setProperty('box-sizing', 'border-box', 'important');
          row.style.setProperty('position', 'relative', 'important');
          row.style.setProperty('transition', 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)', 'important');

          if (isSelected) {
            row.style.setProperty('background', `linear-gradient(135deg, ${iconConf.color} 0%, rgba(${iconConf.rgb}, 0.86) 100%)`, 'important');
            row.style.setProperty('border', '1.5px solid rgba(255, 255, 255, 0.55)', 'important');
            row.style.setProperty('box-shadow', `0 5px 14px rgba(${iconConf.rgb}, 0.42), inset 0 2px 0 rgba(255, 255, 255, 0.35)`, 'important');
            row.style.setProperty('transform', 'translateX(2px) scale(1.01)', 'important');
          } else {
            row.style.setProperty('background', isLight
              ? `linear-gradient(135deg, rgba(${iconConf.rgb}, 0.14) 0%, rgba(${iconConf.rgb}, 0.06) 100%)`
              : `linear-gradient(135deg, rgba(${iconConf.rgb}, 0.18) 0%, rgba(${iconConf.rgb}, 0.08) 100%)`, 'important');
            row.style.setProperty('border', `1.5px solid rgba(${iconConf.rgb}, ${isLight ? 0.32 : 0.36})`, 'important');
            row.style.setProperty('box-shadow', `0 2px 0 rgba(${iconConf.rgb}, ${isLight ? 0.18 : 0.24}), 0 2px 6px rgba(0, 0, 0, ${isLight ? 0.04 : 0.2})`, 'important');
            row.style.setProperty('transform', 'none', 'important');
          }

          // Hide legacy activeBar since the whole card now lights up playfully
          const activeBar = row.querySelector('.cat-active-bar') as HTMLElement | null;
          if (activeBar) {
            activeBar.style.setProperty('display', 'none', 'important');
          }

          if (labelEl) {
            labelEl.style.setProperty('font-family', "'Outfit', 'Inter', system-ui, -apple-system, sans-serif", 'important');
            labelEl.style.setProperty('font-size', '13.5px', 'important');
            labelEl.style.setProperty('font-weight', isSelected ? '700' : '600', 'important');
            labelEl.style.setProperty('letter-spacing', '0.01em', 'important');
            labelEl.style.setProperty('color', isSelected ? '#ffffff' : (isLight ? '#1e293b' : '#f1f5f9'), 'important');
            labelEl.style.setProperty('padding-left', '0', 'important');
            labelEl.style.setProperty('flex', '1', 'important');
            labelEl.style.setProperty('background', 'transparent', 'important');
            labelEl.style.setProperty('background-color', 'transparent', 'important');
            labelEl.style.setProperty('border', 'none', 'important');
          }

          // Strip all native Blockly icon spans/divs
          row.querySelectorAll('.blocklyTreeIcon, .blocklyTreeIconNone, .blocklyToolboxCategoryIcon, [class*="TreeIcon"], [id$=".icon"]').forEach((iconEl: Element) => {
            const icon = iconEl as HTMLElement;
            icon.style.setProperty('display', 'none', 'important');
            icon.style.setProperty('width', '0px', 'important');
            icon.style.setProperty('height', '0px', 'important');
            icon.style.setProperty('min-width', '0px', 'important');
            icon.style.setProperty('margin', '0px', 'important');
            icon.style.setProperty('padding', '0px', 'important');
            icon.style.setProperty('border', 'none', 'important');
            icon.style.setProperty('border-left', 'none', 'important');
            icon.style.setProperty('visibility', 'hidden', 'important');
          });

          let iconBox = row.querySelector('.codekit-icon-box') as HTMLElement | null;
          if (!iconBox) {
            iconBox = document.createElement('div');
            iconBox.className = 'codekit-icon-box';
            if (row.firstChild) {
              row.insertBefore(iconBox, row.firstChild);
            } else {
              row.appendChild(iconBox);
            }
          }
          iconBox.style.setProperty('width', '28px', 'important');
          iconBox.style.setProperty('min-width', '28px', 'important');
          iconBox.style.setProperty('height', '28px', 'important');
          iconBox.style.setProperty('border-radius', '9px', 'important');
          iconBox.style.setProperty('margin-right', '10px', 'important');
          iconBox.style.setProperty('display', 'inline-flex', 'important');
          iconBox.style.setProperty('align-items', 'center', 'important');
          iconBox.style.setProperty('justify-content', 'center', 'important');
          iconBox.style.setProperty('flex-shrink', '0', 'important');
          iconBox.style.setProperty('background-color', isSelected ? 'rgba(255,255,255,0.24)' : iconConf.color, 'important');
          iconBox.style.setProperty('box-shadow', isSelected
            ? 'inset 0 1px 0 rgba(255,255,255,0.45)'
            : `inset 0 2px 0 rgba(255,255,255,0.35), 0 2px 5px rgba(${iconConf.rgb}, 0.35)`, 'important');
          iconBox.innerHTML = iconConf.svg;
        } catch (innerErr) {
          // ignore
        }
      });

      if (contentsEl) {
        contentsEl.querySelectorAll('.cat-section-header').forEach((secEl) => {
          const sec = secEl as HTMLElement;
          const secName = sec.getAttribute('data-section');
          if (searchQuery && secName) {
            let hasVisibleChild = false;
            let current = sec.nextElementSibling;
            while (current && !current.classList.contains('cat-section-header')) {
              if ((current as HTMLElement).style.display !== 'none') {
                hasVisibleChild = true;
                break;
              }
              current = current.nextElementSibling;
            }
            sec.style.display = hasVisibleChild ? 'block' : 'none';
          } else {
            sec.style.display = 'block';
          }
        });
      }

      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    } catch (outerErr) {
      // ignore
    }
  }, [searchQuery]);

  // Stable ref
  const updateToolboxUIRef = React.useRef(updateToolboxUI);
  useEffect(() => {
    updateToolboxUIRef.current = updateToolboxUI;
  }, [updateToolboxUI]);

  useEffect(() => {
    isLightModeRef.current = themeMode === 'light';
  }, [themeMode]);

  useEffect(() => {
    updateToolboxUIRef.current();
  }, [searchQuery]);

  useEffect(() => {
    if (!blocklyDivRef.current) return;

    // Run once after render without heavy 500ms setInterval polling loop
    const t1 = setTimeout(() => updateToolboxUIRef.current(), 200);
    const t2 = setTimeout(() => updateToolboxUIRef.current(), 600);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateToolboxUIRef.current();
        debounceTimer = null;
      }, 200);
    });

    observer.observe(blocklyDivRef.current, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, []);

  const generateCodeForLang = useCallback((lang: 'arduino' | 'python', boardType?: string): string => {
    if (!workspaceRef.current) return '';
    const workspace = workspaceRef.current;
    
    // Check for active Robot Plan
    const containerBlocks = workspace.getBlocksByType('robot_plan_container').filter((b: any) => isBlockActive(b));
    const runPlanBlock = workspace.getBlocksByType('robot_run_plan').find((b: any) => isBlockActive(b));
    const hasRobotPlanBlocks = containerBlocks.length > 0 || !!runPlanBlock;

    if (hasRobotPlanBlocks) {
      let hw: RobotHardwareConfig = {
        ...activeRobotHwConfig,
        pins: { ...activeRobotHwConfig.pins },
      };

      const hwBlock = workspace.getBlocksByType('robot_hw_setup').find((b: any) => isBlockActive(b));
      let hwPatch: Partial<RobotHardwareConfig> | undefined;
      if (hwBlock) {
        const pwmL = hwBlock.getFieldValue('PWM_L') || hw.pins.pwmL;
        const pwmR = hwBlock.getFieldValue('PWM_R') || hw.pins.pwmR;
        const sensorCount = (Number(hwBlock.getFieldValue('SENSOR_COUNT') || hw.sensorCount) as SensorCount);
        const sensorMode = (hwBlock.getFieldValue('SENSOR_MODE') || hw.sensorMode) as 'direct' | 'mux_4051' | 'mux_4067';
        const muxSig = hwBlock.getFieldValue('MUX_SIG') || hw.pins.muxSig;
        const hasEncoder = (hwBlock.getFieldValue('HAS_ENCODER') || (hw.hasEncoder ? 'YES' : 'NO')) === 'YES';
        const encLA = hwBlock.getFieldValue('ENC_L') || hw.pins.encLA;
        const encRA = hwBlock.getFieldValue('ENC_R') || hw.pins.encRA;
        const motorRpm = Number(hwBlock.getFieldValue('MOTOR_RPM') || hw.motorRpm);

        hw = {
          ...hw,
          sensorCount,
          sensorMode,
          hasEncoder,
          motorRpm,
          pins: {
            ...hw.pins,
            pwmL,
            pwmR,
            muxSig,
            encLA,
            encRA,
          },
        };
        hwPatch = { sensorCount, sensorMode, hasEncoder, motorRpm, pins: hw.pins };
      }

      const readChainItems = (startBlock: any): RobotPlanItem[] => {
        const items: RobotPlanItem[] = [];
        let cur = startBlock;
        let autoIndex = 0;
        while (cur) {
          if (cur.disabled || (typeof cur.isEnabled === 'function' && !cur.isEnabled())) {
            cur = cur.getNextBlock();
            continue;
          }
          if (cur.type === 'robot_plan_step') {
            const rawIdx = Number(cur.getFieldValue('INDEX'));
            const idxVal = Number.isFinite(rawIdx) ? rawIdx : autoIndex;
            items.push({
              type: 'step',
              blockId: cur.id,
              index: idxVal,
              action: (cur.getFieldValue('ACTION') || 'MAJU') as PlanActionType,
              triggerValue: Number(cur.getFieldValue('TRIG_VAL') ?? 100),
              triggerUnit: (cur.getFieldValue('TRIG_UNIT') || 'ms') as PlanDurationUnit,
              triggerMode: (cur.getFieldValue('TRIG_MODE') || 'SENSOR') as PlanTriggerMode,
              sensorPattern: normalizeSensorPattern(cur.getFieldValue('PATTERN') || '', hw.sensorCount),
              logicOp: (cur.getFieldValue('LOGIC_OP') || 'OR') as PlanLogicOp,
              brake: Number(cur.getFieldValue('BRAKE') ?? 0),
              speedL: Number(cur.getFieldValue('SPEED_L') ?? 160),
              speedR: Number(cur.getFieldValue('SPEED_R') ?? 160),
              pidId: (Number(cur.getFieldValue('PID_ID') ?? 2) as 0 | 1 | 2 | 3 | 4 | 5),
              speedA: Number(cur.getFieldValue('SPEED_A') ?? 120),
              timerValue: Number(cur.getFieldValue('TIMER_VAL') ?? 120),
              timerUnit: (cur.getFieldValue('TIMER_UNIT') || 'ms') as PlanDurationUnit,
              lineColor: (cur.getFieldValue('LINE_COLOR') || 'HITAM') as PlanLineColor,
            });
            autoIndex = idxVal + 1;
          } else if (cur.type === 'robot_plan_stop') {
            items.push({
              type: 'stop_here',
              blockId: cur.id,
              stage: (cur.getFieldValue('STOP_STAGE') || 'SPEED_A') as StopHereStage,
            });
          }
          cur = cur.getNextBlock();
        }
        return items;
      };

      const extractedPlans: RobotPlan[] = [];
      containerBlocks.forEach((cb: any) => {
        const planId = Math.max(1, Math.min(10, Number(cb.getFieldValue('PLAN_ID') || 1)));
        const firstStep = cb.getInputTargetBlock('STEPS');
        const items = readChainItems(firstStep);
        extractedPlans.push({
          planId,
          blockId: cb.id,
          items,
        });
      });

      const activePlanId = runPlanBlock
        ? Number(runPlanBlock.getFieldValue('PLAN_ID') || 1)
        : extractedPlans[0]?.planId || 1;

      if (lang === 'arduino' && extractedPlans.length > 0) {
        onRobotPlansExtractedRef.current?.(extractedPlans, activePlanId, hwPatch);
      }

      return lang === 'arduino'
        ? generateRobotPlanArduinoCode(hw, extractedPlans, activePlanId)
        : generateRobotPlanPythonCode(hw, extractedPlans, activePlanId);
    }

    const topBlocks = workspace.getTopBlocks(false);
    const activeBoard = boardType ?? board;
    let generatedCode = '';

    if (lang === 'arduino') {
      generatedCode += '// RoboLab Studio - Generated Arduino Code\n';
      generatedCode += `// Blocks in workspace: ${workspace.getAllBlocks(false).filter((b: any) => isBlockActive(b)).map(b => b.type).join(', ')}\n`;
      
      // Include installed library headers only if they are used by workspace blocks
      const libs = installedLibrariesRef.current || [];
      libs.forEach((lib) => {
        if (isLibraryNeeded(lib, workspace)) {
          let header = lib;
          const lowerLib = lib.toLowerCase();
          if (lowerLib.includes('dht')) {
            header = 'DHT';
          } else if (lowerLib.includes('pn532') || lowerLib.includes('adafruit-pn532') || lowerLib.includes('rfid')) {
            header = 'Adafruit_PN532';
          } else if (lowerLib.includes('servo')) {
            header = activeBoard.toLowerCase().includes('esp32') ? 'ESP32Servo' : 'Servo';
          } else if (lowerLib.includes('liquidcrystal') || lowerLib.includes('lcd')) {
            header = 'LiquidCrystal_I2C';
          } else if (lowerLib.includes('ssd1306') || lowerLib.includes('oled')) {
            header = 'Adafruit_SSD1306';
          } else if (lowerLib.includes('mpu6050') || lowerLib.includes('mpu')) {
            header = 'Adafruit_MPU6050';
          } else if (lowerLib.includes('neopixel')) {
            header = 'Adafruit_NeoPixel';
          } else if (lowerLib.includes('pubsub') || lowerLib.includes('mqtt')) {
            header = 'PubSubClient';
          }
          const sanitizedHeader = header.replace(/[^a-zA-Z0-9_]/g, '');
          if (!generatedCode.includes(`#include <${sanitizedHeader}.h>`)) {
            generatedCode += `#include <${sanitizedHeader}.h>\n`;
          }
        }
      });

      // Servo globals
      const servoPins = new Set<string>();
      workspace.getAllBlocks(false).forEach((block: any) => {
        if (!isBlockActive(block)) return;
        if (block.type === 'arduino_servo_write' || block.type === 'pins_servo_write') {
          const pin = block.getFieldValue('PIN');
          if (pin) servoPins.add(pin.toString());
        }
      });

      if (servoPins.size > 0) {
        const servoHeader = activeBoard.toLowerCase().includes('esp32') ? 'ESP32Servo' : 'Servo';
        if (!generatedCode.includes(`#include <${servoHeader}.h>`)) {
          generatedCode += `#include <${servoHeader}.h>\n`;
        }
        servoPins.forEach(pin => {
          const cleanPin = pin.replace(/[^a-zA-Z0-9_]/g, '');
          const varName = `myServo${cleanPin}`;
          if (!generatedCode.includes(`Servo ${varName};`)) {
            generatedCode += `Servo ${varName};\n`;
          }
        });
        generatedCode += '\n';
      }

      // DHT globals
      const dhtBlock = workspace.getBlocksByType('dht_init').find((b: any) => isBlockActive(b));
      if (dhtBlock) {
        let pin = dhtBlock.getFieldValue('PIN') || '4';
        const isEsp8266Board = activeBoard.toLowerCase().includes('esp8266') || activeBoard.toLowerCase().includes('nodemcu');
        if (isEsp8266Board && /^\d+$/.test(pin)) {
          pin = `D${pin}`;
        }
        const type = dhtBlock.getFieldValue('TYPE') || 'DHT11';
        generatedCode += `DHT dht(${pin}, ${type});\n`;
      }

      // MPU6050 globals
      const mpuBlock = workspace.getBlocksByType('mpu6050_init').find((b: any) => isBlockActive(b)) || 
                       workspace.getBlocksByType('mpu6050_read').find((b: any) => isBlockActive(b));
      if (mpuBlock) {
        generatedCode += `Adafruit_MPU6050 mpu;\nsensors_event_t a, g, temp;\n`;
      }

      // RFID / PN532 globals (Fuzzy block type match for custom or built-in RFID blocks)
      const rfidBlock = workspace.getAllBlocks(false).find((b: any) => {
        if (!isBlockActive(b)) return false;
        const t = (b.type || '').toLowerCase();
        return t.includes('rfid') || t.includes('pn532') || t.includes('nfc');
      });
      if (rfidBlock) {
        const i2cBeginBlock = workspace.getBlocksByType('lib_rfid_i2c_begin').find((b: any) => isBlockActive(b));
        const isI2CBlock = !!i2cBeginBlock || (rfidBlock.getField('SDA') && rfidBlock.getField('SCL'));
        
        if (!generatedCode.includes('#include <Wire.h>')) generatedCode += '#include <Wire.h>\n';
        if (!isI2CBlock && !generatedCode.includes('#include <SPI.h>')) generatedCode += '#include <SPI.h>\n';
        if (!generatedCode.includes('#include <Adafruit_PN532.h>')) generatedCode += '#include <Adafruit_PN532.h>\n';
        
        if (!generatedCode.includes('Adafruit_PN532 nfc')) {
          if (isI2CBlock) {
            let sdaPin = i2cBeginBlock ? (i2cBeginBlock.getFieldValue('SDA') || 'D2') : 'D2';
            let sclPin = i2cBeginBlock ? (i2cBeginBlock.getFieldValue('SCL') || 'D1') : 'D1';

            generatedCode += `#define SDA_PIN ${sdaPin}\n#define SCL_PIN ${sclPin}\n\n`;
            generatedCode += `Adafruit_PN532 nfc(-1, -1);\nbool cardPresent = false;\n\n`;
          } else {
            let irqPin = 'D2';
            let rstPin = 'D3';
            try {
              irqPin = rfidBlock.getFieldValue('IRQ') || rfidBlock.getFieldValue('PIN') || 'D2';
              rstPin = rfidBlock.getFieldValue('RESET') || rfidBlock.getFieldValue('RST') || 'D3';
            } catch (_) {}

            const targetBoard = boardType || board || '';
            const isEsp8266Board = targetBoard.toLowerCase().includes('esp8266') || targetBoard.toLowerCase().includes('nodemcu');
            if (isEsp8266Board && /^\d+$/.test(irqPin)) irqPin = `D${irqPin}`;
            if (isEsp8266Board && /^\d+$/.test(rstPin)) rstPin = `D${rstPin}`;

            generatedCode += `#define PN532_IRQ   (${irqPin})\n#define PN532_RESET (${rstPin})\nAdafruit_PN532 nfc(PN532_IRQ, PN532_RESET);\nbool cardPresent = false;\n\n`;
          }

          generatedCode += `String getRFIDUID() {\n`;
          generatedCode += `  uint8_t success;\n`;
          generatedCode += `  uint8_t uid[7];\n`;
          generatedCode += `  uint8_t uidLength;\n`;
          generatedCode += `  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);\n`;
          generatedCode += `  if (success) {\n`;
          generatedCode += `    String uidStr = "";\n`;
          generatedCode += `    for (uint8_t i = 0; i < uidLength; i++) {\n`;
          generatedCode += `      if (uid[i] < 0x10) uidStr += "0";\n`;
          generatedCode += `      uidStr += String(uid[i], HEX);\n`;
          generatedCode += `      if (i < uidLength - 1) uidStr += " ";\n`;
          generatedCode += `    }\n`;
          generatedCode += `    return uidStr;\n`;
          generatedCode += `  }\n`;
          generatedCode += `  return "";\n`;
          generatedCode += `}\n`;
        }
      }

      // Display globals
      const displayBlock = workspace.getBlocksByType('lib_display_begin').find((b: any) => isBlockActive(b)) || 
                           workspace.getBlocksByType('lib_display_clear').find((b: any) => isBlockActive(b)) || 
                           workspace.getBlocksByType('lib_display_print').find((b: any) => isBlockActive(b));
      if (displayBlock) {
        if (!generatedCode.includes('#include <Wire.h>')) generatedCode += '#include <Wire.h>\n';
        if (!generatedCode.includes('#include <Adafruit_GFX.h>')) generatedCode += '#include <Adafruit_GFX.h>\n';
        if (!generatedCode.includes('#include <Adafruit_SSD1306.h>')) generatedCode += '#include <Adafruit_SSD1306.h>\n';
        if (!generatedCode.includes('Adafruit_SSD1306 display')) {
          generatedCode += `Adafruit_SSD1306 display(128, 64, &Wire, -1);\n`;
        }
      }

      // FastLED globals
      const fastledBlock = workspace.getBlocksByType('lib_fastled_begin').find((b: any) => isBlockActive(b)) || 
                           workspace.getBlocksByType('lib_fastled_setrgb').find((b: any) => isBlockActive(b));
      if (fastledBlock) {
        if (!generatedCode.includes('#include <FastLED.h>')) generatedCode += '#include <FastLED.h>\n';
        if (!generatedCode.includes('CRGB leds')) {
          generatedCode += `CRGB leds[60];\n`;
        }
      }

      // Stepper globals
      const stepperBlock = workspace.getBlocksByType('lib_stepper_begin').find((b: any) => isBlockActive(b)) || 
                           workspace.getBlocksByType('lib_stepper_step').find((b: any) => isBlockActive(b));
      if (stepperBlock) {
        if (!generatedCode.includes('#include <Stepper.h>')) generatedCode += '#include <Stepper.h>\n';
        if (!generatedCode.includes('Stepper stepper')) {
          generatedCode += `Stepper stepper(200, 8, 9, 10, 11);\n`;
        }
      }

      // SD globals
      const sdBlock = workspace.getBlocksByType('lib_sd_begin').find((b: any) => isBlockActive(b)) || 
                      workspace.getBlocksByType('lib_sd_open').find((b: any) => isBlockActive(b));
      if (sdBlock) {
        if (!generatedCode.includes('#include <SPI.h>')) generatedCode += '#include <SPI.h>\n';
        if (!generatedCode.includes('#include <SD.h>')) generatedCode += '#include <SD.h>\n';
        if (!generatedCode.includes('File myFile')) {
          generatedCode += `File myFile;\n`;
        }
      }

      // BME globals
      const bmeBlock = workspace.getBlocksByType('lib_bme_begin').find((b: any) => isBlockActive(b)) || 
                       workspace.getBlocksByType('lib_bme_temp').find((b: any) => isBlockActive(b));
      if (bmeBlock) {
        if (!generatedCode.includes('#include <Wire.h>')) generatedCode += '#include <Wire.h>\n';
        if (!generatedCode.includes('#include <Adafruit_Sensor.h>')) generatedCode += '#include <Adafruit_Sensor.h>\n';
        if (!generatedCode.includes('#include <Adafruit_BME280.h>')) generatedCode += '#include <Adafruit_BME280.h>\n';
        if (!generatedCode.includes('Adafruit_BME280 bme')) {
          generatedCode += `Adafruit_BME280 bme;\n`;
        }
      }

      // GPS globals
      const gpsBlock = workspace.getBlocksByType('lib_gps_begin').find((b: any) => isBlockActive(b)) || 
                       workspace.getBlocksByType('lib_gps_lat').find((b: any) => isBlockActive(b));
      if (gpsBlock) {
        if (!generatedCode.includes('#include <SoftwareSerial.h>')) generatedCode += '#include <SoftwareSerial.h>\n';
        if (!generatedCode.includes('#include <TinyGPS++.h>')) generatedCode += '#include <TinyGPS++.h>\n';
        if (!generatedCode.includes('TinyGPSPlus gps')) {
          generatedCode += `TinyGPSPlus gps;\nSoftwareSerial ss(4, 3);\n`;
        }
      }

      // NeoPixel globals
      const neoBlock = workspace.getBlocksByType('neopixel_init').find((b: any) => isBlockActive(b));
      if (neoBlock) {
        const pin = neoBlock.getFieldValue('PIN') || '5';
        const num = neoBlock.getFieldValue('NUM') || '8';
        generatedCode += `Adafruit_NeoPixel pixels(${num}, ${pin}, NEO_GRB + NEO_KHZ800);\n`;
      }

      // MQTT globals
      const mqttBlock = workspace.getBlocksByType('mqtt_init').find((b: any) => isBlockActive(b)) || 
                        workspace.getBlocksByType('mqtt_connect').find((b: any) => isBlockActive(b));
      if (mqttBlock) {
        generatedCode += `WiFiClient espClient;\nPubSubClient client(espClient);\n`;
      }
      
      const hasHttp = workspace.getBlocksByType('esp32_http_get').some((b: any) => isBlockActive(b)) || 
                      workspace.getBlocksByType('esp32_http_post').some((b: any) => isBlockActive(b));
      const hasWebSocket = workspace.getBlocksByType('esp32_websocket_connect').some((b: any) => isBlockActive(b)) ||
                           workspace.getBlocksByType('esp32_websocket_send').some((b: any) => isBlockActive(b)) ||
                           workspace.getBlocksByType('esp32_websocket_loop').some((b: any) => isBlockActive(b)) ||
                           workspace.getBlocksByType('esp32_websocket_has_message').some((b: any) => isBlockActive(b)) ||
                           workspace.getBlocksByType('esp32_websocket_get_message').some((b: any) => isBlockActive(b));

      const hasWiFi = workspace.getBlocksByType('esp32_wifi_connect').some((b: any) => isBlockActive(b)) || 
                    workspace.getBlocksByType('esp32_wifi_status').some((b: any) => isBlockActive(b)) || 
                    workspace.getBlocksByType('esp32_wifi_ip').some((b: any) => isBlockActive(b)) || hasHttp || hasWebSocket;
                    
      const hasBT = workspace.getBlocksByType('esp32_bluetooth_begin').some((b: any) => isBlockActive(b)) || 
                  workspace.getBlocksByType('esp32_bluetooth_available').some((b: any) => isBlockActive(b)) || 
                  workspace.getBlocksByType('esp32_bluetooth_read').some((b: any) => isBlockActive(b)) || 
                  workspace.getBlocksByType('esp32_bluetooth_write').some((b: any) => isBlockActive(b));

      const hasBlynk = workspace.getBlocksByType('blynk_config').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('blynk_begin').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('blynk_run').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('blynk_on_write').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('blynk_param_as_int').some((b: any) => isBlockActive(b)) ||
                       workspace.getBlocksByType('blynk_virtual_write').some((b: any) => isBlockActive(b));
                  
      const isESP8266Board = activeBoard.toLowerCase().includes('esp8266') || activeBoard.toLowerCase().includes('nodemcu');
      const isESP32Board = activeBoard.toLowerCase().includes('esp32');

      if (hasBlynk) {
        const blynkConfigBlock = workspace.getBlocksByType('blynk_config').find((b: any) => isBlockActive(b));
        if (blynkConfigBlock) {
          const tIdBlock = blynkConfigBlock.getInputTargetBlock('TEMPLATE_ID');
          const tNameBlock = blynkConfigBlock.getInputTargetBlock('TEMPLATE_NAME');
          const authBlock = blynkConfigBlock.getInputTargetBlock('AUTH_TOKEN');
          const tId = tIdBlock ? getBlockValue(tIdBlock, 'arduino') : '"TMPLxxxxxx"';
          const tName = tNameBlock ? getBlockValue(tNameBlock, 'arduino') : '"MyDevice"';
          const auth = authBlock ? getBlockValue(authBlock, 'arduino') : '"YourAuthToken"';
          generatedCode += `#define BLYNK_TEMPLATE_ID ${tId}\n#define BLYNK_TEMPLATE_NAME ${tName}\n#define BLYNK_AUTH_TOKEN ${auth}\n\n`;
        }
        generatedCode += '#define BLYNK_PRINT Serial\n';
        if (isESP8266Board) {
          generatedCode += '#include <ESP8266WiFi.h>\n#include <BlynkSimpleEsp8266.h>\n';
        } else if (isESP32Board) {
          generatedCode += '#include <WiFi.h>\n#include <BlynkSimpleEsp32.h>\n';
        } else {
          generatedCode += '#if defined(ESP8266)\n#include <ESP8266WiFi.h>\n#include <BlynkSimpleEsp8266.h>\n#else\n#include <WiFi.h>\n#include <BlynkSimpleEsp32.h>\n#endif\n';
        }
      }

      if (hasWiFi && !hasBlynk) {
        if (isESP8266Board) {
          generatedCode += '#include <ESP8266WiFi.h>\n';
        } else if (isESP32Board) {
          generatedCode += '#include <WiFi.h>\n';
        } else {
          generatedCode += '#if defined(ESP8266)\n#include <ESP8266WiFi.h>\n#else\n#include <WiFi.h>\n#endif\n';
        }
      }
      if (hasHttp) {
        if (isESP8266Board) {
          generatedCode += '#include <ESP8266HTTPClient.h>\n#include <WiFiClientSecure.h>\n';
        } else if (isESP32Board) {
          generatedCode += '#include <HTTPClient.h>\n#include <WiFiClientSecure.h>\n';
        } else {
          generatedCode += '#if defined(ESP8266)\n#include <ESP8266HTTPClient.h>\n#else\n#include <HTTPClient.h>\n#endif\n#include <WiFiClientSecure.h>\n';
        }
      }
      if (hasWebSocket) {
        generatedCode += '#include <WebSocketsClient.h>\n';
        generatedCode += 'WebSocketsClient webSocket;\n';
        generatedCode += 'String _ws_last_message = "";\n';
        generatedCode += 'bool _ws_has_message = false;\n';
        generatedCode += 'void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {\n';
        generatedCode += '  if(type == WStype_TEXT) {\n';
        generatedCode += '    _ws_last_message = String((char*)payload);\n';
        generatedCode += '    _ws_has_message = true;\n';
        generatedCode += '  }\n';
        generatedCode += '}\n';
      }
      if (hasBT) {
        generatedCode += '#include <BluetoothSerial.h>\n';
        generatedCode += 'BluetoothSerial SerialBT;\n';
      }
      generatedCode += '\n';

      // Declare all Blockly variables globally in Arduino C++
      const variables = workspace.getVariableMap().getAllVariables();
      if (variables.length > 0) {
        generatedCode += '// Global Variables\n';
        variables.forEach((v: any) => {
          generatedCode += `double ${v.name} = 0;\n`;
        });
        generatedCode += '\n';
      }

      const setupBlocks = topBlocks.filter(b => isBlockActive(b) && b.type === 'arduino_setup');
      const loopBlocks = topBlocks.filter(b => isBlockActive(b) && b.type === 'arduino_loop');

      // Render Blynk Callback Functions
      const blynkWriteBlocks = topBlocks.filter(b => isBlockActive(b) && b.type === 'blynk_on_write');
      if (blynkWriteBlocks.length > 0) {
        generatedCode += '// Blynk Callback Functions\n';
        blynkWriteBlocks.forEach((bBlock: any) => {
          const vpin = bBlock.getFieldValue('VPIN') || 'V0';
          generatedCode += `BLYNK_WRITE(${vpin}) {\n`;
          generatedCode += `  int param_val = param.asInt();\n`;
          const stackContent = bBlock.getInputTargetBlock('STACK');
          if (stackContent) {
            generatedCode += generateBlockCode(stackContent, '  ', 'arduino');
          }
          generatedCode += '}\n\n';
        });
      }

      // Render custom procedure function definitions at global scope
      const funcBlocks = topBlocks.filter(b => isBlockActive(b) && (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn'));
      if (funcBlocks.length > 0) {
        generatedCode += '// Custom Functions\n';
        funcBlocks.forEach((funcBlock: any) => {
          const funcName = funcBlock.getFieldValue('NAME') || 'myFunction';
          const args: string[] = funcBlock.arguments_ || [];
          const typedArgs = args.map(a => `double ${a}`).join(', ');
          const isReturn = funcBlock.type === 'procedures_defreturn';
          const returnType = isReturn ? 'double' : 'void';
          
          generatedCode += `${returnType} ${funcName}(${typedArgs}) {\n`;
          const stackContent = funcBlock.getInputTargetBlock('STACK');
          if (stackContent) {
            generatedCode += generateBlockCode(stackContent, '  ', 'arduino');
          }
          if (isReturn) {
            const retBlock = funcBlock.getInputTargetBlock('RETURN');
            const retVal = retBlock ? getBlockValue(retBlock, 'arduino') : '0';
            generatedCode += `  return ${retVal};\n`;
          }
          generatedCode += '}\n\n';
        });
      }

      // Auto-collect used pins to generate pinMode declarations (only from active blocks)
      const outputs = new Set<string>();
      const inputs = new Set<string>();
      workspace.getAllBlocks(false).forEach(block => {
        if (!isBlockActive(block)) return;
        if (block.type === 'pin_digital_write' || block.type === 'pin_analog_write') {
          const pin = block.getFieldValue('PIN');
          if (pin && (!isNaN(Number(pin)) || /^A\d+$/.test(pin))) {
            outputs.add(pin);
          }
        } else if (block.type === 'pin_digital_read' || block.type === 'pin_analog_read') {
          const pin = block.getFieldValue('PIN');
          if (pin && (!isNaN(Number(pin)) || /^A\d+$/.test(pin))) {
            inputs.add(pin);
          }
        }
      });

      // Render Setup
      generatedCode += 'void setup() {\n';
      generatedCode += '  Serial.begin(115200);\n';
      
      // Auto-generated pinMode declarations
      if (outputs.size > 0 || inputs.size > 0) {
        generatedCode += '  // Configure I/O pins\n';
        outputs.forEach(pin => {
          generatedCode += `  pinMode(${pin}, OUTPUT);\n`;
        });
        inputs.forEach(pin => {
          generatedCode += `  pinMode(${pin}, INPUT);\n`;
        });
        generatedCode += '\n';
      }

      if (servoPins.size > 0) {
        generatedCode += '  // Initialize Servos\n';
        servoPins.forEach(pin => {
          const cleanPin = pin.replace(/[^a-zA-Z0-9_]/g, '');
          const varName = `myServo${cleanPin}`;
          generatedCode += `  ${varName}.attach(${pin});\n`;
        });
        generatedCode += '\n';
      }

      setupBlocks.forEach(sb => {
        const setupContent = sb.getInputTargetBlock('STACK');
        if (setupContent) {
          generatedCode += generateBlockCode(setupContent, '  ', 'arduino');
        }
      });
      generatedCode += '}\n\n';

      // Render Loop
      generatedCode += 'void loop() {\n';
      loopBlocks.forEach(lb => {
        const loopContent = lb.getInputTargetBlock('STACK');
        if (loopContent) {
          generatedCode += generateBlockCode(loopContent, '  ', 'arduino');
        }
      });
      
      // NOTE: Standalone/orphaned top blocks are strictly excluded from void loop()
      generatedCode += '}\n';
    } else {
      if (activeBoard === 'BBC micro:bit') {
        // === BBC micro:bit: MicroPython langsung, tanpa wrapper def ===
        generatedCode += '# RoboLab Studio - Generated MicroPython Code (BBC micro:bit)\n';
        generatedCode += 'from microbit import *\n\n';

        const mbFuncBlocks = topBlocks.filter(b => isBlockActive(b) && (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn'));
        mbFuncBlocks.forEach((funcBlock: any) => {
          const funcName = funcBlock.getFieldValue('NAME') || 'myFunction';
          const args: string[] = funcBlock.arguments_ || [];
          const isReturn = funcBlock.type === 'procedures_defreturn';
          generatedCode += `def ${funcName}(${args.join(', ')}):\n`;
          const stackContent = funcBlock.getInputTargetBlock('STACK');
          let hasContent = false;
          if (stackContent) {
            const body = generateBlockCode(stackContent, '    ', 'python');
            if (body.trim()) {
              generatedCode += body;
              hasContent = true;
            }
          }
          if (isReturn) {
            const retBlock = funcBlock.getInputTargetBlock('RETURN');
            const retVal = retBlock ? getBlockValue(retBlock, 'python') : 'None';
            generatedCode += `    return ${retVal}\n`;
            hasContent = true;
          }
          if (!hasContent) {
            generatedCode += '    pass\n';
          }
          generatedCode += '\n';
        });

        const mbSetupBlocks = topBlocks.filter(b => isBlockActive(b) && (b.type === 'arduino_setup' || b.type === 'basic_on_start'));
        const mbLoopBlocks = topBlocks.filter(b => isBlockActive(b) && b.type === 'arduino_loop');
        const mbForeverBlocks = topBlocks.filter(b => isBlockActive(b) && b.type === 'basic_forever');
        const mbEventBlocks = topBlocks.filter(b => isBlockActive(b) && (b.type === 'input_on_button_pressed' || b.type === 'input_on_gesture'));

        // Setup langsung (tanpa indentasi)
        mbSetupBlocks.forEach(sb => {
          if (sb.type === 'arduino_setup') {
            const setupContent = sb.getInputTargetBlock('STACK');
            if (setupContent) {
              generatedCode += generateBlockCode(setupContent, '', 'python');
            }
          } else {
            generatedCode += generateBlockCode(sb, '', 'python');
          }
        });

        // Loop langsung dengan while True:
        if (mbLoopBlocks.length > 0) {
          generatedCode += '\nwhile True:\n';
          let hasContent = false;
          mbLoopBlocks.forEach(lb => {
            const loopContent = lb.getInputTargetBlock('STACK');
            if (loopContent) {
              generatedCode += generateBlockCode(loopContent, '    ', 'python');
              hasContent = true;
            }
          });
          if (!hasContent) {
            generatedCode += '    pass\n';
          }
        }

        // basic_forever blocks
        mbForeverBlocks.forEach(fb => {
          generatedCode += '\n' + generateBlockCode(fb, '', 'python');
        });

        // Event blocks
        mbEventBlocks.forEach(eb => {
          generatedCode += '\n' + generateBlockCode(eb, '', 'python');
        });

        if (mbSetupBlocks.length === 0 && mbLoopBlocks.length === 0 && mbForeverBlocks.length === 0 && mbEventBlocks.length === 0 && mbFuncBlocks.length === 0) {
          generatedCode += 'pass\n';
        }
      } else {
        // === Arduino / ESP32: Standard MicroPython ===
        generatedCode += 'import machine\n';
        generatedCode += 'import time\n\n';
        
        // Auto-collect used pins (only from active blocks)
        const outputs = new Set<string>();
        const inputs = new Set<string>();
        workspace.getAllBlocks(false).forEach(block => {
          if (!isBlockActive(block)) return;
          if (block.type === 'pin_digital_write' || block.type === 'pin_analog_write') {
            const pin = block.getFieldValue('PIN');
            if (pin) outputs.add(pin);
          } else if (block.type === 'pin_digital_read' || block.type === 'pin_analog_read') {
            const pin = block.getFieldValue('PIN');
            if (pin) inputs.add(pin);
          }
        });

        if (outputs.size > 0 || inputs.size > 0) {
          outputs.forEach(pin => {
              if (Array.from(workspace.getAllBlocks(false)).some(b => isBlockActive(b) && b.type === 'pin_analog_write' && b.getFieldValue('PIN') === pin)) {
                 const pwmBlock = Array.from(workspace.getAllBlocks(false)).find(b => isBlockActive(b) && b.type === 'pin_analog_write' && b.getFieldValue('PIN') === pin);
                 const freq = pwmBlock ? (pwmBlock.getFieldValue('FREQ') || 1000) : 1000;
                 generatedCode += `pwm${pin} = machine.PWM(machine.Pin(${pin}), freq=${freq})\n`;
               } else {
               generatedCode += `pin${pin} = machine.Pin(${pin}, machine.Pin.OUT)\n`;
             }
          });
          inputs.forEach(pin => {
             const cleanPin = pin.replace(/\D/g, '');
             if (Array.from(workspace.getAllBlocks(false)).some(b => isBlockActive(b) && b.type === 'pin_analog_read' && b.getFieldValue('PIN') === pin)) {
               generatedCode += `adc${cleanPin} = machine.ADC(machine.Pin(${cleanPin}))\n`;
             } else {
               generatedCode += `pin${pin} = machine.Pin(${pin}, machine.Pin.IN)\n`;
             }
          });
          generatedCode += '\n';
        }

        const pyFuncBlocks = topBlocks.filter(b => isBlockActive(b) && (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn'));
        pyFuncBlocks.forEach((funcBlock: any) => {
          const funcName = funcBlock.getFieldValue('NAME') || 'myFunction';
          const args: string[] = funcBlock.arguments_ || [];
          const isReturn = funcBlock.type === 'procedures_defreturn';
          generatedCode += `def ${funcName}(${args.join(', ')}):\n`;
          const stackContent = funcBlock.getInputTargetBlock('STACK');
          let hasContent = false;
          if (stackContent) {
            const body = generateBlockCode(stackContent, '    ', 'python');
            if (body.trim()) {
              generatedCode += body;
              hasContent = true;
            }
          }
          if (isReturn) {
            const retBlock = funcBlock.getInputTargetBlock('RETURN');
            const retVal = retBlock ? getBlockValue(retBlock, 'python') : 'None';
            generatedCode += `    return ${retVal}\n`;
            hasContent = true;
          }
          if (!hasContent) {
            generatedCode += '    pass\n';
          }
          generatedCode += '\n';
        });

        const setupBlocks = topBlocks.filter(b => isBlockActive(b) && b.type === 'arduino_setup');
        const loopBlocks = topBlocks.filter(b => isBlockActive(b) && b.type === 'arduino_loop');

        // Render Setup Content
        setupBlocks.forEach(sb => {
          const setupContent = sb.getInputTargetBlock('STACK');
          if (setupContent) {
            generatedCode += generateBlockCode(setupContent, '', 'python');
          }
        });

        // NOTE: Standalone/orphaned top blocks are strictly excluded from Python script

        // Render Loop Content
        if (loopBlocks.length > 0) {
          generatedCode += '\nwhile True:\n';
          let hasContent = false;
          loopBlocks.forEach(lb => {
            const loopContent = lb.getInputTargetBlock('STACK');
            if (loopContent) {
              generatedCode += generateBlockCode(loopContent, '    ', 'python');
              hasContent = true;
            }
          });
          if (!hasContent) {
            generatedCode += '    pass\n';
          }
        }
      }
    }

    return generatedCode;
  }, [board]);

  // Trigger code update when installed libraries change
  const installedLibrariesStr = JSON.stringify(installedLibraries);
  useEffect(() => {
    if (updateCodeRef.current) {
      updateCodeRef.current();
    }
  }, [installedLibrariesStr]);

  // Dynamic XML Toolbox generator based on installed libraries and active board
  const getToolboxXml = (libs: string[], boardType?: string) => {
    // ── BBC micro:bit: isolated toolbox with only Micro:bit categories ──
    if (boardType === 'BBC micro:bit') {
      return `
    <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
      <category name="Logic" colour="#4C97FF" css-container="cat-logic" css-row="cat-logic">
        <block type="controls_if"></block>
        <block type="robolab_logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_negate"></block>
        <block type="logic_boolean"></block>
      </category>
      <category name="Loops" colour="#FFAB19" css-container="cat-loop" css-row="cat-loop">
        <block type="arduino_setup"></block>
        <block type="arduino_loop"></block>
        <block type="controls_repeat_ext">
          <value name="TIMES">
            <block type="math_number">
              <field name="NUM">10</field>
            </block>
          </value>
        </block>
        <block type="controls_whileUntil"></block>
        <block type="controls_for">
          <value name="FROM">
            <block type="math_number"><field name="NUM">1</field></block>
          </value>
          <value name="TO">
            <block type="math_number"><field name="NUM">10</field></block>
          </value>
          <value name="BY">
            <block type="math_number"><field name="NUM">1</field></block>
          </value>
        </block>
      </category>
      <category name="Math" colour="#40BF4A" css-container="cat-math" css-row="cat-math">
        <block type="math_number"></block>
        <block type="math_arithmetic"></block>
        <block type="math_single"></block>
        <block type="math_round"></block>
      </category>
      <category name="Text" colour="#4CBFE6" css-container="cat-text" css-row="cat-text">
        <block type="text"></block>
        <block type="text_join"></block>
      </category>
      <category name="Variables" colour="#FF8C1A" custom="VARIABLE" css-container="cat-variables" css-row="cat-variables">
      </category>
      <category name="Micro:bit" colour="#2AC1BC" css-container="cat-microbit" css-row="cat-microbit">
        <category name="Basic" colour="#2AC1BC" css-container="cat-mb-basic" css-row="cat-mb-basic">
          <block type="arduino_setup"></block>
          <block type="arduino_loop"></block>
          <block type="basic_show_string">
            <value name="TEXT">
              <block type="text">
                <field name="TEXT">Hello!</field>
              </block>
            </value>
          </block>
          <block type="basic_show_number">
            <value name="NUMBER">
              <block type="math_number">
                <field name="NUM">0</field>
              </block>
            </value>
          </block>
          <block type="basic_show_leds"></block>
          <block type="basic_show_icon"></block>
          <block type="basic_clear_screen"></block>
          <block type="basic_pause">
            <value name="MS">
              <block type="math_number">
                <field name="NUM">500</field>
              </block>
            </value>
          </block>
        </category>
        <category name="Input" colour="#12B886" css-container="cat-mb-input" css-row="cat-mb-input">
          <block type="input_on_button_pressed"></block>
          <block type="input_button_is_pressed"></block>
          <block type="input_on_gesture"></block>
          <block type="input_temperature"></block>
          <block type="input_light_level"></block>
          <block type="input_compass_heading"></block>
        </category>
        <category name="Music" colour="#E286F2" css-container="cat-mb-music" css-row="cat-mb-music">
          <block type="music_play_tone">
            <value name="NOTE">
              <block type="math_number"><field name="NUM">440</field></block>
            </value>
            <value name="DURATION">
              <block type="math_number"><field name="NUM">500</field></block>
            </value>
          </block>
        </category>
        <category name="Radio" colour="#74C0FC" css-container="cat-mb-radio" css-row="cat-mb-radio">
          <block type="radio_send_number">
            <value name="NUMBER">
              <block type="math_number"><field name="NUM">0</field></block>
            </value>
          </block>
        </category>
        <category name="Pins" colour="#4a90e2" css-container="cat-mb-pins" css-row="cat-mb-pins">
          <block type="pins_digital_write">
            <field name="PIN">P0</field>
            <value name="VALUE">
              <block type="math_number"><field name="NUM">1</field></block>
            </value>
          </block>
          <block type="pins_analog_write">
            <field name="PIN">P0</field>
            <value name="VALUE">
              <block type="math_number"><field name="NUM">512</field></block>
            </value>
          </block>
          <block type="pins_servo_write">
            <field name="PIN">P0</field>
            <value name="VALUE">
              <block type="math_number"><field name="NUM">180</field></block>
            </value>
          </block>
          <block type="pins_digital_read"></block>
          <block type="pins_analog_read"></block>
        </category>
      </category>
    </xml>`;
    }
    const curSc = activeRobotHwConfig?.sensorCount || 6;
    const presets = getSensorPresetOptions(curSc);
    const centerPreset = presets.find((p) => p.category === 'center') || presets[0] || { pattern: '00xx00' };
    const leftPreset =
      presets.find((p) => p.category === 'left' && p.id === 'left_2') ||
      presets.find((p) => p.category === 'left') ||
      presets[0] ||
      centerPreset;
    const rightPreset =
      presets.find((p) => p.category === 'right' && p.id === 'right_2') ||
      presets.find((p) => p.category === 'right') ||
      presets[0] ||
      centerPreset;
    const wingPreset = presets.find((p) => p.category === 'wings') || centerPreset;
    const crossPreset = presets.find((p) => p.category === 'all') || centerPreset;

    let xml = `
    <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
      <category name="Robot Plan" colour="#f97316" css-container="cat-robot-plan" css-row="cat-robot-plan">
        <block type="robot_hw_setup"></block>
        <block type="robot_plan_container">
          <field name="PLAN_ID">1</field>
        </block>
        <block type="robot_plan_step">
          <field name="INDEX">0</field>
          <field name="ACTION">MAJU</field>
          <field name="TRIG_VAL">100</field>
          <field name="TRIG_UNIT">ms</field>
          <field name="TRIG_MODE">SENSOR</field>
          <field name="SENSOR_PRESET">${centerPreset.pattern}</field>
          <field name="PATTERN">${centerPreset.pattern}</field>
          <field name="LOGIC_OP">OR</field>
          <field name="BRAKE">0</field>
          <field name="SPEED_L">160</field>
          <field name="SPEED_R">160</field>
          <field name="PID_ID">2</field>
          <field name="SPEED_A">140</field>
          <field name="TIMER_VAL">200</field>
          <field name="TIMER_UNIT">ms</field>
          <field name="LINE_COLOR">HITAM</field>
        </block>
        <block type="robot_plan_step">
          <field name="INDEX">1</field>
          <field name="ACTION">LEFT</field>
          <field name="TRIG_VAL">80</field>
          <field name="TRIG_UNIT">ms</field>
          <field name="TRIG_MODE">SENSOR</field>
          <field name="SENSOR_PRESET">${leftPreset.pattern}</field>
          <field name="PATTERN">${leftPreset.pattern}</field>
          <field name="LOGIC_OP">OR</field>
          <field name="BRAKE">15</field>
          <field name="SPEED_L">140</field>
          <field name="SPEED_R">140</field>
          <field name="PID_ID">3</field>
          <field name="SPEED_A">130</field>
          <field name="TIMER_VAL">120</field>
          <field name="TIMER_UNIT">ms</field>
          <field name="LINE_COLOR">HITAM</field>
        </block>
        <block type="robot_plan_step">
          <field name="INDEX">2</field>
          <field name="ACTION">RIGHT</field>
          <field name="TRIG_VAL">80</field>
          <field name="TRIG_UNIT">ms</field>
          <field name="TRIG_MODE">SENSOR</field>
          <field name="SENSOR_PRESET">${rightPreset.pattern}</field>
          <field name="PATTERN">${rightPreset.pattern}</field>
          <field name="LOGIC_OP">OR</field>
          <field name="BRAKE">15</field>
          <field name="SPEED_L">140</field>
          <field name="SPEED_R">140</field>
          <field name="PID_ID">3</field>
          <field name="SPEED_A">130</field>
          <field name="TIMER_VAL">120</field>
          <field name="TIMER_UNIT">ms</field>
          <field name="LINE_COLOR">HITAM</field>
        </block>
        <block type="robot_plan_step">
          <field name="INDEX">3</field>
          <field name="ACTION">MAJU</field>
          <field name="TRIG_VAL">80</field>
          <field name="TRIG_UNIT">ms</field>
          <field name="TRIG_MODE">SENSOR</field>
          <field name="SENSOR_PRESET">${wingPreset.pattern}</field>
          <field name="PATTERN">${wingPreset.pattern}</field>
          <field name="LOGIC_OP">OR</field>
          <field name="BRAKE">20</field>
          <field name="SPEED_L">150</field>
          <field name="SPEED_R">150</field>
          <field name="PID_ID">2</field>
          <field name="SPEED_A">120</field>
          <field name="TIMER_VAL">150</field>
          <field name="TIMER_UNIT">ms</field>
          <field name="LINE_COLOR">HITAM</field>
        </block>
        <block type="robot_plan_step">
          <field name="INDEX">4</field>
          <field name="ACTION">MAJU</field>
          <field name="TRIG_VAL">100</field>
          <field name="TRIG_UNIT">ms</field>
          <field name="TRIG_MODE">SENSOR</field>
          <field name="SENSOR_PRESET">${crossPreset.pattern}</field>
          <field name="PATTERN">${crossPreset.pattern}</field>
          <field name="LOGIC_OP">EQUAL</field>
          <field name="BRAKE">25</field>
          <field name="SPEED_L">160</field>
          <field name="SPEED_R">160</field>
          <field name="PID_ID">5</field>
          <field name="SPEED_A">120</field>
          <field name="TIMER_VAL">150</field>
          <field name="TIMER_UNIT">ms</field>
          <field name="LINE_COLOR">HITAM</field>
        </block>
        <block type="robot_plan_step">
          <field name="INDEX">5</field>
          <field name="ACTION">MAJU</field>
          <field name="TRIG_VAL">500</field>
          <field name="TRIG_UNIT">ms</field>
          <field name="TRIG_MODE">MOTION</field>
          <field name="SENSOR_PRESET">CUSTOM</field>
          <field name="PATTERN">${centerPreset.pattern}</field>
          <field name="LOGIC_OP">OR</field>
          <field name="BRAKE">0</field>
          <field name="SPEED_L">180</field>
          <field name="SPEED_R">180</field>
          <field name="PID_ID">0</field>
          <field name="SPEED_A">0</field>
          <field name="TIMER_VAL">0</field>
          <field name="TIMER_UNIT">ms</field>
          <field name="LINE_COLOR">HITAM</field>
        </block>
        <block type="robot_plan_stop">
          <field name="STOP_STAGE">SPEED_A</field>
        </block>
        <block type="robot_run_plan">
          <field name="PLAN_ID">1</field>
        </block>
      </category>
      <category name="Logic" colour="#4C97FF" css-container="cat-logic" css-row="cat-logic">
        <block type="controls_if"></block>
        <block type="robolab_logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_negate"></block>
        <block type="logic_boolean"></block>
      </category>
      <category name="Loops" colour="#FFAB19" css-container="cat-loop" css-row="cat-loop">
        <block type="arduino_setup"></block>
        <block type="arduino_loop"></block>
        <block type="controls_repeat_ext">
          <value name="TIMES">
            <block type="math_number">
              <field name="NUM">10</field>
            </block>
          </value>
        </block>
        <block type="controls_whileUntil"></block>
        <block type="controls_for">
          <value name="FROM">
            <block type="math_number">
              <field name="NUM">1</field>
            </block>
          </value>
          <value name="TO">
            <block type="math_number">
              <field name="NUM">10</field>
            </block>
          </value>
          <value name="BY">
            <block type="math_number">
              <field name="NUM">1</field>
            </block>
          </value>
        </block>
      </category>
      <category name="Math" colour="#40BF4A" css-container="cat-math" css-row="cat-math">
        <block type="math_number"></block>
        <block type="math_arithmetic"></block>
        <block type="math_single"></block>
        <block type="math_round"></block>
        <block type="arduino_map"></block>
        <block type="arduino_constrain"></block>
        <block type="arduino_random"></block>
      </category>
      <category name="Text" colour="#4CBFE6" css-container="cat-text" css-row="cat-text">
        <block type="text"></block>
        <block type="text_join"></block>
        <block type="arduino_serial_print"></block>
        <block type="arduino_serial_print_inline"></block>
      </category>
      <category name="Variables" colour="#FF8C1A" custom="VARIABLE" css-container="cat-variables" css-row="cat-variables">
      </category>
      <category name="Functions" colour="#FF6680" custom="PROCEDURE" css-container="cat-functions" css-row="cat-functions">
        <block type="arduino_setup"></block>
        <block type="arduino_loop"></block>
      </category>
      <category name="Input/Output" colour="#9966FF" css-container="cat-io" css-row="cat-io">
        <block type="pin_digital_write"></block>
        <block type="pin_digital_read"></block>
        <block type="pin_analog_write"></block>
        <block type="pin_analog_read"></block>
      </category>
      <category name="Time" colour="#FF4081" css-container="cat-time" css-row="cat-time">
        <block type="arduino_delay"></block>
      </category>
      <category name="Arduino" colour="#14B8A6" css-container="cat-arduino" css-row="cat-arduino">
        <block type="arduino_setup"></block>
        <block type="arduino_loop"></block>
        <block type="arduino_serial_available"></block>
        <block type="arduino_serial_read"></block>
        <block type="arduino_pulsein"></block>
        <block type="arduino_tone"></block>
        <block type="arduino_notone"></block>
      </category>
      <category name="ESP32" colour="#059669" css-container="cat-esp32" css-row="cat-esp32">
        <block type="esp32_touch_read"></block>
        <block type="esp32_hall_read"></block>
      </category>
      <category name="Bluetooth" colour="#00B0FF" css-container="cat-bluetooth" css-row="cat-bluetooth">
        <block type="esp32_bluetooth_begin"></block>
        <block type="esp32_bluetooth_available"></block>
        <block type="esp32_bluetooth_read"></block>
        <block type="esp32_bluetooth_write"></block>
      </category>
      <category name="Servo" colour="#FF6D00" css-container="cat-servo" css-row="cat-servo">
        <block type="arduino_servo_write"></block>
      </category>

      <category name="Sensors" colour="#A855F7" css-container="cat-sensor" css-row="cat-sensor">
        <block type="sensor_ultrasonic"></block>
      </category>
      <category name="Displays" colour="#F59E0B" css-container="cat-display" css-row="cat-display">
        <block type="lib_display_begin"></block>
        <block type="lib_display_clear"></block>
        <block type="lib_display_print"></block>
        <block type="lib_display_setcursor"></block>
      </category>
      <category name="IoT" colour="#0EA5E9" css-container="cat-iot" css-row="cat-iot">
        <block type="esp32_wifi_connect"></block>
        <block type="esp32_wifi_status"></block>
        <block type="esp32_wifi_ip"></block>
        <block type="esp32_http_get"></block>
        <block type="esp32_http_post"></block>
        <block type="esp32_websocket_connect"></block>
        <block type="esp32_websocket_loop"></block>
        <block type="esp32_websocket_send"></block>
        <block type="esp32_websocket_has_message"></block>
        <block type="esp32_websocket_get_message"></block>
        <block type="mqtt_init"></block>
        <block type="mqtt_connect"></block>
        <block type="mqtt_publish"></block>
        <block type="mqtt_subscribe"></block>
        <block type="blynk_config"></block>
        <block type="blynk_begin"></block>
        <block type="blynk_run"></block>
        <block type="blynk_on_write"></block>
        <block type="blynk_param_as_int"></block>
        <block type="blynk_virtual_write"></block>
      </category>
    `;

    const normalizedLibs = libs.map(l => l.toLowerCase());

    // Hardcoded essential library categories (blocks defined at module level)
    const hasDht = normalizedLibs.some(l => l.includes('dht'));
    const hasMpu = normalizedLibs.some(l => l.includes('mpu6050') || l.includes('mpu_6050'));
    const hasNeo = normalizedLibs.some(l => l.includes('neopixel') || l.includes('neo_pixel'));
    const hasIR = normalizedLibs.some(l => l.includes('irremote') || l.includes('ir_remote') || l.includes('infrared'));
    const hasUltrasonic = normalizedLibs.some(l => l.includes('ultrasonic') || l.includes('hcsr04') || l.includes('hc_sr04'));

    if (hasDht) {
      xml += `
      <category name="DHT Sensor" colour="#2d9cdb" css-row="cat-dht">
        <block type="dht_init"></block>
        <block type="dht_read_temp"></block>
        <block type="dht_read_humi"></block>
      </category>
      `;
    }
    if (hasMpu) {
      xml += `
      <category name="MPU6050 IMU" colour="#9b51e0" css-row="cat-mpu">
        <block type="mpu6050_init"></block>
        <block type="mpu6050_read"></block>
      </category>
      `;
    }
    if (hasNeo) {
      xml += `
      <category name="NeoPixel RGB" colour="#eb5757" css-row="cat-neopixel">
        <block type="neopixel_init"></block>
        <block type="neopixel_set_color"></block>
        <block type="neopixel_show"></block>
      </category>
      `;
    }
    if (hasIR) {
      xml += `
      <category name="IR Remote" colour="#f2994a" css-row="cat-ir">
        <block type="arduino_serial_available"></block>
        <block type="arduino_serial_read"></block>
      </category>
      `;
    }
    if (hasUltrasonic) {
      xml += `
      <category name="Ultrasonic Sensor" colour="#e0e0e0" css-row="cat-ultrasonic">
        <block type="sensor_ultrasonic"></block>
      </category>
      `;
    }

    // ── Dynamic & Hardware LIBRARY_SIGNATURES scan ──────────────────────────
    // Register all library signatures and display their toolbox categories (skip Display since Displays is already in core hardware)
    LIBRARY_SIGNATURES.forEach((sig, idx) => {
      registerLibraryBlocks(sig);
      if (sig.categoryName.toLowerCase() === 'display') return;
      xml += `<category name="${sig.categoryName}" colour="${sig.colour}" css-row="cat-lib-${idx}">`;
      sig.blocks.forEach(bd => {
        xml += `<block type="${bd.type}"></block>`;
      });
      xml += `</category>`;
    });

    // ── Catch-all: GitHub libs not matched by any known pattern ────────────
    // Known patterns from hardcoded + LIBRARY_SIGNATURES patterns:
    const allKnownPatterns = [
      'dht', 'mpu6050', 'neopixel', 'mqtt', 'pubsub', 'servo',
      'irremote', 'infrared', 'ultrasonic', 'hcsr04',
      'robolab', 'arduinojson', 'wire', 'spi', 'wifi', 'bluetooth',
      'webserver', 'esp32', 'esp8266', 'arduino',
      ...LIBRARY_SIGNATURES.flatMap(s => s.patterns)
    ];
    const unknownLibs = libs.filter(lib => {
      const lower = lib.toLowerCase();
      return !allKnownPatterns.some(pat => lower.includes(pat));
    });
    if (unknownLibs.length > 0) {
      unknownLibs.forEach(lib => {
        const safeName = lib.replace(/[^a-zA-Z0-9_\-]/g, '');
        const typeBegin = `custom_${safeName}_begin`.toLowerCase();
        const typeRead  = `custom_${safeName}_read`.toLowerCase();
        const typePrint = `custom_${safeName}_print`.toLowerCase();

        // Register generic blocks on-the-fly for this unknown library
        const genericDefs: any[] = [];
        if (!Blockly.Blocks[typeBegin]) {
          genericDefs.push({ type: typeBegin, message0: `${safeName} Begin / Init`, previousStatement: null, nextStatement: null, colour: 45, tooltip: `Initialize ${lib}`, helpUrl: '' });
        }
        if (!Blockly.Blocks[typeRead]) {
          genericDefs.push({ type: typeRead, message0: `${safeName} Read`, output: 'Number', colour: 45, tooltip: `Read value from ${lib}`, helpUrl: '' });
        }
        if (!Blockly.Blocks[typePrint]) {
          genericDefs.push({ type: typePrint, message0: `${safeName} Print / Send %1`, args0: [{ type: 'input_value', name: 'DATA' }], previousStatement: null, nextStatement: null, colour: 45, tooltip: `Send data via ${lib}`, helpUrl: '' });
        }
        try { if (genericDefs.length > 0) Blockly.defineBlocksWithJsonArray(genericDefs); } catch (_) {}

        xml += `<category name="${safeName}" colour="#6c757d" css-row="cat-variables">`;
        xml += `<block type="${typeBegin}"></block>`;
        xml += `<block type="${typeRead}"></block>`;
        xml += `<block type="${typePrint}"></block>`;
        xml += `</category>`;
      });
    }

    xml += `</xml>`;
    return xml;
  };

  // Trigger code update and toolbox update when installed libraries or board changes
  useEffect(() => {
    if (workspaceRef.current) {
      const xmlText = getToolboxXml(installedLibraries, board);
      const xmlDom = Blockly.utils.xml.textToDom(xmlText);
      workspaceRef.current.updateToolbox(xmlDom);
      if (updateCodeRef.current) {
        updateCodeRef.current();
      }
      setTimeout(() => updateToolboxUI(), 100);
    }
  }, [installedLibrariesStr, board, robotHardwareConfig?.sensorCount, updateToolboxUI]);

  useEffect(() => {
    if (!blocklyDivRef.current) return;

    // Inject Blockly
    const xmlDom = Blockly.utils.xml.textToDom(getToolboxXml(installedLibrariesRef.current, board));
    const isLight = themeMode === 'light';
    const workspace = Blockly.inject(blocklyDivRef.current, {
      toolbox: xmlDom,
      grid: {
        spacing: 25,
        length: 1.5,
        colour: isLight ? '#cbd5e1' : '#1e293b',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.85,
        maxScale: 2,
        minScale: 0.3,
        scaleSpeed: 1.15,
      },
      renderer: 'zelos',
      theme: {
        name: isLight ? 'light' : 'dark',
        base: Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: isLight ? '#f8fafc' : '#08090d',
          toolboxBackgroundColour: isLight ? '#ffffff' : '#0f172a',
          toolboxTextColour: isLight ? '#1e293b' : '#c5c6ca',
          flyoutBackgroundColour: isLight ? '#f1f5f9' : '#14151b',
          flyoutTextColour: isLight ? '#334155' : '#c5c6ca',
          scrollbarColour: isLight ? '#cbd5e1' : '#2e323e',
          scrollbarOpacity: isLight ? 0.8 : 0.6,
          insertionMarkerColour: isLight ? '#0891b2' : '#38bdf8',
        } as any,
      },
      sounds: false, // Disable CDN audio to prevent fetch errors in offline/Electron mode
    });

    workspaceRef.current = workspace;

    // Keep Flyout sub-menu at a comfortable kid-friendly scale and refresh card highlight on category click
    try {
      const flyout = (workspace as any).getFlyout?.();
      if (flyout) {
        const flyoutScale = 0.78;
        flyout.MARGIN = 12;
        flyout.GAP_Y = 14;
        flyout.getFlyoutScale = () => flyoutScale;
        const flyoutWs = flyout.getWorkspace?.();
        if (flyoutWs) {
          flyoutWs.scale = flyoutScale;
          if (typeof flyoutWs.setScale === 'function') {
            flyoutWs.setScale(flyoutScale);
          }
        }
        const origShow = flyout.show?.bind(flyout);
        if (origShow) {
          flyout.show = (flyoutDef: any) => {
            const ws = flyout.getWorkspace?.();
            if (ws) {
              ws.scale = flyoutScale;
              if (typeof ws.setScale === 'function') ws.setScale(flyoutScale);
            }
            origShow(flyoutDef);
            if (ws) {
              ws.scale = flyoutScale;
              if (typeof ws.setScale === 'function') ws.setScale(flyoutScale);
            }
            if (typeof flyout.reflow === 'function') {
              flyout.reflow();
            }
            setTimeout(() => updateToolboxUIRef.current(), 20);
          };
        }
      }
    } catch (e) {
      // ignore
    }

    // Apply CodeKit toolbox styles after Blockly fully renders
    // Use ref to avoid stale closure (inject effect deps don't include updateToolboxUI)
    setTimeout(() => updateToolboxUIRef.current(), 250);
    setTimeout(() => updateToolboxUIRef.current(), 600);
    setTimeout(() => updateToolboxUIRef.current(), 1200);

    // Initial blocks
    try {
      const defaultXml = `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="arduino_setup" x="40" y="40">
          </block>
          <block type="arduino_loop" x="40" y="160">
          </block>
        </xml>
      `;
      const xmlToLoad = workspaceXml || defaultXml;
      lastLoadedXmlRef.current = xmlToLoad;
      isLoadingXmlRef.current = true;
      Blockly.Events.disable();
      try {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xmlToLoad), workspace);
      } catch (xmlErr) {
        console.warn("[RoboLab] Failed to load workspace XML, trying default XML:", xmlErr);
        workspace.clear();
        try {
          Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(defaultXml), workspace);
        } catch (_) {}
      } finally {
        Blockly.Events.enable();
        isLoadingXmlRef.current = false;
      }
    } catch (e) {
      isLoadingXmlRef.current = false;
      console.error(e);
    }

    // Listener to generate code
    // Listener to generate code
    const MICROBIT_ICON_MAP: { [key: string]: string } = {
      HEART: "09090:99999:99999:09990:00900",
      SMALL_HEART: "00000:09090:09990:00900:00000",
      HAPPY: "00000:09090:00000:90009:09990",
      SAD: "00000:09090:00000:09990:90009",
      SURPRISED: "09090:00000:00900:09090:00900",
      SILLY: "90009:00000:99999:00990:09900",
      FABULOUS: "99099:99099:00000:09990:09990",
      MEH: "09090:00000:00990:09900:00000",
      YES: "00000:00009:00090:90900:09000",
      NO: "90009:09090:00900:09090:90009",
      TRIANGLE: "00000:00900:09090:99999:00000",
      TRIANGLE_LEFT: "90000:99000:90900:90090:99999",
      CHESSBOARD: "09090:90909:09090:90909:09090",
      DIAMOND: "00900:09990:90009:09990:00900",
      DIAMOND_SMALL: "00000:00900:09090:00900:00000",
      SQUARE: "99999:90009:90009:90009:99999",
      SQUARE_SMALL: "00000:09990:09090:09990:00000",
      RABBIT: "90900:90900:99990:90090:99990",
      COW: "90009:90009:99999:09990:00900",
      MUSIC_CROTCHET: "00900:00900:00900:99900:99900",
      MUSIC_QUAVER: "00910:00110:00100:99100:99000",
      PITCHFORK: "90909:90909:99999:00900:00900",
      XMAS: "00900:09990:00900:09990:99999",
      PACMAN: "09999:99090:99900:99990:09999",
      TARGET: "00900:09990:99099:09990:00900",
      TSHIRT: "99099:09990:09990:09990:09990",
      ROLLERSKATE: "00099:00099:99999:99999:09090",
      DUCK: "09900:99900:09999:09990:00000",
      HOUSE: "00900:09990:99999:09090:09990",
      TORTOISE: "00000:09990:99999:09090:00000",
      BUTTERFLY: "99099:99999:00900:99999:99099",
      STICKFIGURE: "00900:99999:00900:09090:90009",
      GHOST: "99999:90909:99999:99999:90909",
      SWORD: "00900:00900:00900:09090:00900",
      GIRAFFE: "99000:09000:09000:09990:09090",
      SKULL: "09990:90909:99999:09990:09990",
      UMBRELLA: "09990:99999:00900:90900:09900",
      SNAKE: "99000:00900:09990:09000:00999",
      ASLEEP: "00000:99099:00000:09990:00000",
      CONFUSED: "00000:09090:00000:09090:09090",
      ANGRY: "90009:09090:00000:99999:90909",
      LOVE: "09090:99999:99999:09990:00900",
      SMILE: "00000:09090:00000:00000:09990",
    };

    const extractMicrobitFrames = (): string[] => {
      if (!workspaceRef.current) return [];
      const ws = workspaceRef.current;
      const frames: string[] = [];

      const scanBlocks = (block: Blockly.Block | null) => {
        if (!block || !isBlockActive(block)) return;
        const type = block.type;

        if (type === 'basic_show_icon') {
          const icon = block.getFieldValue('ICON') || '';
          const pattern = MICROBIT_ICON_MAP[icon.toUpperCase()];
          if (pattern) frames.push(pattern);

        } else if (type === 'basic_show_string') {
          const valBlock = block.getInputTargetBlock('TEXT');
          let text = '';
          if (valBlock && valBlock.type === 'text') {
            text = valBlock.getFieldValue('TEXT') || '';
          } else if (valBlock) {
            // for variables or expressions, show placeholder
            text = valBlock.getFieldValue('VAR') || valBlock.getFieldValue('NAME') || '?';
          }
          frames.push('TEXT:' + text);

        } else if (type === 'basic_show_number') {
          const valBlock = block.getInputTargetBlock('NUMBER');
          let num = '0';
          if (valBlock && valBlock.type === 'math_number') {
            num = valBlock.getFieldValue('NUM') || '0';
          } else if (valBlock) {
            num = '?';
          }
          frames.push('TEXT:' + num);

        } else if (type === 'basic_show_leds') {
          // Extract 5x5 LED pattern
          let pattern = '';
          for (let r = 0; r < 5; r++) {
            let row = '';
            for (let c = 0; c < 5; c++) {
              const val = block.getFieldValue(`LED${r}${c}`);
              row += (val === 'TRUE' || val === true || val === '1') ? '9' : '0';
            }
            pattern += (r > 0 ? ':' : '') + row;
          }
          if (pattern) frames.push(pattern);

        } else if (type === 'basic_clear_screen') {
          frames.push('00000:00000:00000:00000:00000');
        }

        // Recurse into next block in sequence
        const next = block.getNextBlock();
        if (next) scanBlocks(next);

        // Recurse into child blocks (STACK inputs)
        ['STACK', 'DO', 'DO0', 'DO1'].forEach(name => {
          const child = block.getInputTargetBlock(name);
          if (child) scanBlocks(child);
        });
      };

      // Scan setup, loop, forever, on_start, and event blocks (only if active)
      const topBlocks = ws.getTopBlocks(false);
      topBlocks.forEach(tb => {
        if (!isBlockActive(tb)) return;
        if (tb.type === 'arduino_setup' || tb.type === 'arduino_loop') {
          const stack = tb.getInputTargetBlock('STACK');
          if (stack) scanBlocks(stack);
        } else if (tb.type === 'basic_on_start' || tb.type === 'basic_forever' || tb.type === 'input_on_button_pressed' || tb.type === 'input_on_gesture') {
          const handler = tb.getInputTargetBlock('HANDLER');
          if (handler) scanBlocks(handler);
        }
      });

      return frames;
    };

    const updateCode = () => {
      if (isLoadingXmlRef.current) return;
      try {
        // Baca board & codeType dari ref agar selalu dapat nilai terbaru (hindari stale closure)
        const currentBoard = boardRef.current;
        const currentCodeType = codeTypeRef.current;
        const generatedCode = generateCodeForLang(currentCodeType, currentBoard);
        latestCodeRef.current = generatedCode;
        
        const otherLang = currentCodeType === 'arduino' ? 'python' : 'arduino';
        const otherCode = generateCodeForLang(otherLang, currentBoard);
        if (onCodeChangeRef.current) {
          onCodeChangeRef.current(generatedCode, otherCode);
        }

        // BBC micro:bit: send display frames directly to simulator
        if (currentBoard === 'BBC micro:bit' && onMicrobitPreviewRef.current) {
          const frames = extractMicrobitFrames();
          onMicrobitPreviewRef.current(frames);
        }
      } catch (err) {
        console.error("[RoboLab Generator Error]:", err);
      }
    };


    // Listener to serialize workspace XML and notify parent
    const handleWorkspaceXmlChange = (event: any) => {
      if (isLoadingXmlRef.current) return;
      if (event.isUiEvent) return;
      if (workspace && onWorkspaceChangeRef.current) {
        const dom = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToText(dom);
        lastLoadedXmlRef.current = xmlText;
        generatedXmlsRef.current.add(xmlText);
        if (generatedXmlsRef.current.size > 100) {
          const firstKey = generatedXmlsRef.current.keys().next().value;
          if (firstKey !== undefined) {
            generatedXmlsRef.current.delete(firstKey);
          }
        }
        onWorkspaceChangeRef.current(xmlText);
      }
    };

    workspace.addChangeListener(updateCode);
    workspace.addChangeListener(handleWorkspaceXmlChange);
    updateCodeRef.current = updateCode;

    // Force initial resize so SVG canvas fills the container correctly.
    // This fixes the "blank blockly canvas" bug when the panel has zero size at mount time.
    requestAnimationFrame(() => {
      Blockly.svgResize(workspace);
      if (isSyncWithBlocksRef.current) {
        updateCode(); // Initial generation after resize
      } else {
        latestCodeRef.current = generateCodeForLang(codeTypeRef.current, boardRef.current);
        if (boardRef.current === 'BBC micro:bit' && onMicrobitPreviewRef.current) {
          onMicrobitPreviewRef.current(extractMicrobitFrames());
        }
      }
    });

    // ResizeObserver: re-sync SVG whenever the container div changes size
    // (e.g., switching from split→full, panel collapse, window resize)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && blocklyDivRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (workspaceRef.current) {
          Blockly.svgResize(workspaceRef.current);
        }
      });
      resizeObserver.observe(blocklyDivRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []);

  // Re-generate code without destroying workspace when switching between C++ and Python tabs
  useEffect(() => {
    if (workspaceRef.current) {
      latestCodeRef.current = generateCodeForLang(codeType, boardRef.current);
      if (isSyncWithBlocksRef.current && updateCodeRef.current) {
        updateCodeRef.current();
      }
    }
  }, [codeType]);

  // Re-generate code whenever board prop changes (e.g., user switches board)
  useEffect(() => {
    if (isSyncWithBlocksRef.current && updateCodeRef.current) {
      updateCodeRef.current();
    }
  }, [board]);

  // Force code generation when sync is re-enabled
  useEffect(() => {
    if (isSyncWithBlocks && updateCodeRef.current) {
      updateCodeRef.current();
    }
  }, [isSyncWithBlocks]);

  // Load workspace XML programmatically if changed from parent (external sync)
  // PENTING: isSyncWithBlocks TIDAK boleh ada di dependency array ini.
  // Kalau ada, setiap kali sync toggle berubah, workspace akan di-clear dan
  // di-reload ulang dari XML sehingga menyebabkan blok hilang dan kode hancur.
  useEffect(() => {
    if (workspaceRef.current && workspaceXml) {
      try {
        if (workspaceXml !== lastLoadedXmlRef.current) {
          // If this XML was generated by our own edits, skip reloading it
          if (generatedXmlsRef.current.has(workspaceXml)) {
            lastLoadedXmlRef.current = workspaceXml;
            generatedXmlsRef.current.delete(workspaceXml);
            return;
          }

          // Jangan clear workspace jika XML kosong atau tidak valid
          if (!workspaceXml.includes('<block') && !workspaceXml.includes('<xml')) {
            return;
          }

          lastLoadedXmlRef.current = workspaceXml;
          isLoadingXmlRef.current = true;
          Blockly.Events.disable();
          try {
            workspaceRef.current.clear();
            Blockly.Xml.domToWorkspace(
              Blockly.utils.xml.textToDom(workspaceXml),
              workspaceRef.current
            );
          } finally {
            Blockly.Events.enable();
            isLoadingXmlRef.current = false;
          }
          Blockly.svgResize(workspaceRef.current);
          // Setelah load XML selesai, generate ulang kode hanya jika sync aktif
          if (isSyncWithBlocksRef.current && updateCodeRef.current) {
            updateCodeRef.current();
          }
        }
      } catch (e) {
        isLoadingXmlRef.current = false;
        console.error("Error loading external workspace XML:", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceXml]); // <-- isSyncWithBlocks sengaja dikeluarkan dari deps!

  // Helper to resolve the code representation of input blocks
  const getBlockValue = (block: Blockly.Block, lang: 'arduino' | 'python'): string => {
    if (!block) return '';
    
    if (block.type === 'text') {
      const val = block.getFieldValue('TEXT') || '';
      return `"${val}"`;
    }
    if (block.type === 'math_number') {
      return block.getFieldValue('NUM') || '0';
    }
    if (block.type === 'logic_boolean') {
      const val = block.getFieldValue('BOOL');
      if (lang === 'arduino') return val === 'TRUE' ? 'true' : 'false';
      return val === 'TRUE' ? 'True' : 'False';
    }
    if (block.type === 'pin_digital_read') {
      const pin = block.getFieldValue('PIN');
      if (lang === 'arduino') return `digitalRead(${pin})`;
      if (board === 'BBC micro:bit') return `pin${pin}.read_digital()`;
      return `pin${pin}.value()`;
    }
    if (block.type === 'pin_analog_read') {
      const pin = block.getFieldValue('PIN');
      if (lang === 'arduino') return `analogRead(${pin})`;
      const cleanPin = pin.replace(/\D/g, '');
      if (board === 'BBC micro:bit') return `pin${cleanPin}.read_analog()`;
      return `adc${cleanPin}.read()`;
    }
    if (block.type === 'procedures_callreturn') {
      const funcName = block.getFieldValue('NAME') || 'myFunction';
      const args: string[] = [];
      let i = 0;
      while (block.getInput('ARG' + i)) {
        const argBlock = block.getInputTargetBlock('ARG' + i);
        args.push(argBlock ? getBlockValue(argBlock, lang) : '0');
        i++;
      }
      return `${funcName}(${args.join(', ')})`;
    }
    if (block.type === 'sensor_ultrasonic') {
      const trig = block.getFieldValue('TRIGGER');
      const echo = block.getFieldValue('ECHO');
      if (lang === 'arduino') return `readUltrasonic(${trig}, ${echo})`;
      return `robot.read_ultrasonic(${trig}, ${echo})`;
    }
    if (block.type === 'ai_detect') {
      const obj = block.getFieldValue('OBJECT');
      if (lang === 'arduino') return `Robot.detectObject("${obj}")`;
      return `robot.detect("${obj}")`;
    }
    const blockTypeLower = (block.type || '').toLowerCase();
    if (blockTypeLower.includes('rfid') || blockTypeLower.includes('pn532') || blockTypeLower.includes('nfc')) {
      if (blockTypeLower.includes('iscard') || blockTypeLower.includes('present')) {
        if (lang === 'arduino') return `(getRFIDUID() != "")`;
        return `robot.rfid_is_card()`;
      }
      if (lang === 'arduino') return `getRFIDUID()`;
      return `robot.rfid_read()`;
    }
    if (block.type === 'lib_bme_temp') {
      if (lang === 'arduino') return `bme.readTemperature()`;
      return `robot.bme_read_temp()`;
    }
    if (block.type === 'lib_bme_pressure') {
      if (lang === 'arduino') return `bme.readPressure()`;
      return `robot.bme_read_pressure()`;
    }
    if (block.type === 'lib_bme_humidity') {
      if (lang === 'arduino') return `bme.readHumidity()`;
      return `robot.bme_read_humidity()`;
    }
    if (block.type === 'lib_gps_lat') {
      if (lang === 'arduino') return `gps.location.lat()`;
      return `robot.gps_lat()`;
    }
    if (block.type === 'lib_gps_lng') {
      if (lang === 'arduino') return `gps.location.lng()`;
      return `robot.gps_lng()`;
    }
    if (block.type === 'lib_gps_speed') {
      if (lang === 'arduino') return `gps.speed.kmph()`;
      return `robot.gps_speed()`;
    }
    if (block.type === 'lib_keypad_read') {
      if (lang === 'arduino') return `keypad.getKey()`;
      return `robot.keypad_read()`;
    }
    if (block.type.startsWith('custom_') && block.type.endsWith('_read')) {
      if (lang === 'arduino') return `0`;
      return `0`;
    }
    if (block.type === 'arduino_serial_available') {
      if (lang === 'arduino') return `Serial.available()`;
      return `robot.serial_available()`;
    }
    if (block.type === 'arduino_serial_read') {
      if (lang === 'arduino') return `Serial.read()`;
      return `robot.serial_read()`;
    }
    if (block.type === 'robolab_logic_compare') {
      const aBlock = block.getInputTargetBlock('A');
      const bBlock = block.getInputTargetBlock('B');
      const op = block.getFieldValue('OP');
      const aVal = aBlock ? getBlockValue(aBlock, lang) : '0';
      const bVal = bBlock ? getBlockValue(bBlock, lang) : '0';
      
      let opSign = '==';
      if (op === 'LT') opSign = '<';
      if (op === 'GT') opSign = '>';
      if (op === 'EQ') opSign = '==';
      if (op === 'NEQ') opSign = '!=';
      if (op === 'LTE') opSign = '<=';
      if (op === 'GTE') opSign = '>=';
      
      return `(${aVal} ${opSign} ${bVal})`;
    }
    if (block.type === 'logic_operation') {
      const aBlock = block.getInputTargetBlock('A');
      const bBlock = block.getInputTargetBlock('B');
      const op = block.getFieldValue('OP');
      const aVal = aBlock ? getBlockValue(aBlock, lang) : 'false';
      const bVal = bBlock ? getBlockValue(bBlock, lang) : 'false';
      
      let opSign = lang === 'arduino' ? '&&' : 'and';
      if (op === 'OR') opSign = lang === 'arduino' ? '||' : 'or';
      
      return `(${aVal} ${opSign} ${bVal})`;
    }
    if (block.type === 'logic_negate') {
      const aBlock = block.getInputTargetBlock('BOOL');
      const aVal = aBlock ? getBlockValue(aBlock, lang) : 'false';
      if (lang === 'arduino') return `!(${aVal})`;
      return `not (${aVal})`;
    }
    if (block.type === 'math_arithmetic') {
      const aBlock = block.getInputTargetBlock('A');
      const bBlock = block.getInputTargetBlock('B');
      const op = block.getFieldValue('OP');
      const aVal = aBlock ? getBlockValue(aBlock, lang) : '0';
      const bVal = bBlock ? getBlockValue(bBlock, lang) : '0';
      
      let opSign = '+';
      if (op === 'MINUS') opSign = '-';
      if (op === 'MULTIPLY') opSign = '*';
      if (op === 'DIVIDE') opSign = '/';
      if (op === 'POWER') {
        if (lang === 'arduino') return `pow(${aVal}, ${bVal})`;
        return `(${aVal} ** ${bVal})`;
      }
      return `(${aVal} ${opSign} ${bVal})`;
    }
    if (block.type === 'variables_get') {
      const varModel = block.getField('VAR')?.getText() || 'x';
      return varModel;
    }
    if (block.type === 'text_join') {
      const parts: string[] = [];
      let i = 0;
      while (true) {
        const inputBlock = block.getInputTargetBlock('ADD' + i);
        if (!inputBlock) break;
        parts.push(getBlockValue(inputBlock, lang));
        i++;
      }
      if (lang === 'arduino') {
        return `String(${parts.join(') + String(')})`;
      }
      return `str(${parts.join(') + str(')})`;
    }
    if (block.type === 'math_single') {
      const op = block.getFieldValue('OP');
      const valBlock = block.getInputTargetBlock('NUM');
      const val = valBlock ? getBlockValue(valBlock, lang) : '0';
      
      if (lang === 'arduino') {
        if (op === 'ROOT') return `sqrt(${val})`;
        if (op === 'ABS') return `abs(${val})`;
        if (op === 'NEG') return `-(${val})`;
        if (op === 'LN') return `log(${val})`;
        if (op === 'LOG10') return `log10(${val})`;
        if (op === 'EXP') return `exp(${val})`;
        if (op === 'POW10') return `pow(10, ${val})`;
        return `${op.toLowerCase()}(${val})`;
      } else {
        if (op === 'ROOT') return `math.sqrt(${val})`;
        if (op === 'ABS') return `abs(${val})`;
        if (op === 'NEG') return `-(${val})`;
        if (op === 'LN') return `math.log(${val})`;
        if (op === 'LOG10') return `math.log10(${val})`;
        if (op === 'EXP') return `math.exp(${val})`;
        if (op === 'POW10') return `math.pow(10, ${val})`;
        return `math.${op.toLowerCase()}(${val})`;
      }
    }
    if (block.type === 'math_round') {
      const op = block.getFieldValue('OP');
      const valBlock = block.getInputTargetBlock('NUM');
      const val = valBlock ? getBlockValue(valBlock, lang) : '0';
      
      if (lang === 'arduino') {
        if (op === 'ROUNDUP') return `ceil(${val})`;
        if (op === 'ROUNDDOWN') return `floor(${val})`;
        return `round(${val})`;
      } else {
        if (op === 'ROUNDUP') return `math.ceil(${val})`;
        if (op === 'ROUNDDOWN') return `math.floor(${val})`;
        return `round(${val})`;
      }
    }
    if (block.type === 'arduino_map') {
      const val = getBlockValue(block.getInputTargetBlock('VAL')!, lang);
      const fl = getBlockValue(block.getInputTargetBlock('FL')!, lang);
      const fh = getBlockValue(block.getInputTargetBlock('FH')!, lang);
      const tl = getBlockValue(block.getInputTargetBlock('TL')!, lang);
      const th = getBlockValue(block.getInputTargetBlock('TH')!, lang);
      if (lang === 'arduino') {
        return `map(${val || 0}, ${fl || 0}, ${fh || 0}, ${tl || 0}, ${th || 0})`;
      }
      return `int((${val || 0} - ${fl || 0}) * (${th || 0} - ${tl || 0}) / (${fh || 0} - ${fl || 0}) + ${tl || 0})`;
    }
    if (block.type === 'arduino_constrain') {
      const val = getBlockValue(block.getInputTargetBlock('VAL')!, lang);
      const low = getBlockValue(block.getInputTargetBlock('LOW')!, lang);
      const high = getBlockValue(block.getInputTargetBlock('HIGH')!, lang);
      if (lang === 'arduino') {
        return `constrain(${val || 0}, ${low || 0}, ${high || 0})`;
      }
      return `max(${low || 0}, min(${val || 0}, ${high || 0}))`;
    }
    if (block.type === 'arduino_random') {
      const min = getBlockValue(block.getInputTargetBlock('MIN')!, lang);
      const max = getBlockValue(block.getInputTargetBlock('MAX')!, lang);
      if (lang === 'arduino') {
        return `random(${min || 0}, ${max || 0})`;
      }
      return `random.randint(${min || 0}, ${max || 0})`;
    }
    if (block.type === 'arduino_pulsein') {
      const pin = block.getFieldValue('PIN');
      const state = block.getFieldValue('STATE');
      if (lang === 'arduino') return `pulseIn(${pin}, ${state})`;
      return `robot.pulse_in(${pin}, "${state}")`;
    }
    if (block.type === 'dht_read_temp') {
      if (lang === 'arduino') return `dht.readTemperature()`;
      return `robot.dht_read_temp()`;
    }
    if (block.type === 'dht_read_humi') {
      if (lang === 'arduino') return `dht.readHumidity()`;
      return `robot.dht_read_humi()`;
    }
    if (block.type === 'mpu6050_read') {
      const val = block.getFieldValue('VAL');
      if (lang === 'arduino') {
        if (val === 'ACCEL_X') return `(mpu.getEvent(&a, &g, &temp), a.acceleration.x)`;
        if (val === 'ACCEL_Y') return `(mpu.getEvent(&a, &g, &temp), a.acceleration.y)`;
        if (val === 'ACCEL_Z') return `(mpu.getEvent(&a, &g, &temp), a.acceleration.z)`;
        if (val === 'GYRO_X') return `(mpu.getEvent(&a, &g, &temp), g.gyro.x)`;
        if (val === 'GYRO_Y') return `(mpu.getEvent(&a, &g, &temp), g.gyro.y)`;
        if (val === 'GYRO_Z') return `(mpu.getEvent(&a, &g, &temp), g.gyro.z)`;
      }
      return `robot.mpu_read("${val}")`;
    }
    if (block.type === 'mqtt_connect') {
      const serverBlock = block.getInputTargetBlock('SERVER');
      const portBlock = block.getInputTargetBlock('PORT');
      const idBlock = block.getInputTargetBlock('CLIENT_ID');
      const server = serverBlock ? getBlockValue(serverBlock, lang) : '"broker.hivemq.com"';
      const port = portBlock ? getBlockValue(portBlock, lang) : '1883';
      const cid = idBlock ? getBlockValue(idBlock, lang) : '"ESP32_Client"';
      if (lang === 'arduino') {
        return `(client.setServer(${server}, ${port}), client.connect(${cid}))`;
      }
      return `robot.mqtt_connect(${server}, ${port}, ${cid})`;
    }
    if (block.type === 'esp32_wifi_status') {
      if (lang === 'arduino') return `(WiFi.status() == WL_CONNECTED)`;
      return `robot.wifi_is_connected()`;
    }
    if (block.type === 'esp32_wifi_ip') {
      if (lang === 'arduino') return `WiFi.localIP().toString()`;
      return `robot.wifi_get_ip()`;
    }
    if (block.type === 'esp32_http_get') {
      const urlBlock = block.getInputTargetBlock('URL');
      const url = urlBlock ? getBlockValue(urlBlock, lang) : '""';
      if (lang === 'arduino') {
        return `([]() -> String { String _u = ${url}; HTTPClient http; String payload = ""; if (_u.startsWith("https://")) { WiFiClientSecure client; client.setInsecure(); if (http.begin(client, _u)) { int httpCode = http.GET(); if (httpCode > 0) payload = http.getString(); http.end(); } } else { WiFiClient client; if (http.begin(client, _u)) { int httpCode = http.GET(); if (httpCode > 0) payload = http.getString(); http.end(); } } return payload; })()`;
      }
      return `robot.http_get(${url})`;
    }
    if (block.type === 'esp32_http_post') {
      const urlBlock = block.getInputTargetBlock('URL');
      const typeBlock = block.getInputTargetBlock('CONTENT_TYPE');
      const dataBlock = block.getInputTargetBlock('DATA');
      const url = urlBlock ? getBlockValue(urlBlock, lang) : '""';
      const type = typeBlock ? getBlockValue(typeBlock, lang) : '""';
      const data = dataBlock ? getBlockValue(dataBlock, lang) : '""';
      if (lang === 'arduino') {
        return `([]() -> String { String _u = ${url}; HTTPClient http; String payload = ""; if (_u.startsWith("https://")) { WiFiClientSecure client; client.setInsecure(); if (http.begin(client, _u)) { http.addHeader("Content-Type", ${type}); int httpCode = http.POST(${data}); if (httpCode > 0) payload = http.getString(); http.end(); } } else { WiFiClient client; if (http.begin(client, _u)) { http.addHeader("Content-Type", ${type}); int httpCode = http.POST(${data}); if (httpCode > 0) payload = http.getString(); http.end(); } } return payload; })()`;
      }
      return `robot.http_post(${url}, ${type}, ${data})`;
    }
    if (block.type === 'esp32_websocket_has_message') {
      if (lang === 'arduino') return `_ws_has_message`;
      return `robot.websocket_has_message()`;
    }
    if (block.type === 'esp32_websocket_get_message') {
      if (lang === 'arduino') return `([]() -> String { _ws_has_message = false; return _ws_last_message; })()`;
      return `robot.websocket_get_message()`;
    }
    if (block.type === 'esp32_bluetooth_available') {
      if (lang === 'arduino') return `SerialBT.available()`;
      return `robot.bluetooth_available()`;
    }
    if (block.type === 'esp32_bluetooth_read') {
      if (lang === 'arduino') return `SerialBT.read()`;
      return `robot.bluetooth_read()`;
    }
    if (block.type === 'esp32_touch_read') {
      const pin = block.getFieldValue('PIN');
      if (lang === 'arduino') return `touchRead(${pin})`;
      return `robot.touch_read(${pin})`;
    }
    if (block.type === 'esp32_hall_read') {
      if (lang === 'arduino') return `hallRead()`;
      return `robot.hall_read()`;
    }
    if (block.type === 'blynk_param_as_int') {
      if (lang === 'arduino') return `param.asInt()`;
      return `param_val`;
    }
    
    // Microbit E-Learning Expressions
    if (block.type === 'input_button_is_pressed') {
      const btn = block.getFieldValue('BUTTON');
      if (lang === 'arduino') return `(digitalRead(PIN_BUTTON_${btn}) == LOW)`;
      return `button_${btn.toLowerCase()}.is_pressed()`;
    }
    if (block.type === 'input_temperature') {
      if (lang === 'arduino') return `Microbit.readTemperature()`;
      return `temperature()`;
    }
    if (block.type === 'input_light_level') {
      if (lang === 'arduino') return `Microbit.readLightLevel()`;
      return `display.read_light_level()`;
    }
    if (block.type === 'input_compass_heading') {
      if (lang === 'arduino') return `Microbit.readCompassHeading()`;
      return `compass.heading()`;
    }
    if (block.type === 'pins_digital_read') {
      const pin = block.getFieldValue('PIN');
      if (lang === 'arduino') return `digitalRead(${pin})`;
      const pinNum = pin.replace(/\D/g, '');
      return `pin${pinNum}.read_digital()`;
    }
    if (block.type === 'pins_analog_read') {
      const pin = block.getFieldValue('PIN');
      if (lang === 'arduino') return `analogRead(${pin})`;
      const pinNum = pin.replace(/\D/g, '');
      return `pin${pinNum}.read_analog()`;
    }
    
    return '';

  };

  // Small custom generator helper to support clean output
  const generateBlockCode = (block: Blockly.Block, indent: string, lang: 'arduino' | 'python'): string => {
    let code = '';
    let currentBlock: Blockly.Block | null = block;

    while (currentBlock) {
      if (currentBlock.disabled || (typeof (currentBlock as any).isEnabled === 'function' && !(currentBlock as any).isEnabled())) {
        currentBlock = currentBlock.getNextBlock();
        continue;
      }
      if (currentBlock.type === 'arduino_delay') {
        const ms = currentBlock.getFieldValue('MS');
        if (lang === 'arduino') {
          code += `${indent}delay(${ms});\n`;
        } else {
          code += `${indent}time.sleep(${parseFloat(ms) / 1000.0})\n`;
        }
      } else if (currentBlock.type === 'pin_digital_write') {
        const pin = currentBlock.getFieldValue('PIN');
        const state = currentBlock.getFieldValue('STATE');
        const stateVal = state === 'HIGH' ? '1' : '0';
        if (lang === 'arduino') {
          code += `${indent}digitalWrite(${pin}, ${state});\n`;
        } else {
          if (board === 'BBC micro:bit') {
            code += `${indent}pin${pin}.write_digital(${stateVal})\n`;
          } else {
            code += `${indent}pin${pin}.value(${stateVal})\n`;
          }
        }
      } else if (currentBlock.type === 'pin_analog_write') {
        const pin = currentBlock.getFieldValue('PIN');
        const freq = currentBlock.getFieldValue('FREQ') || 1000;
        const valBlock = currentBlock.getInputTargetBlock('VALUE');
        const value = valBlock ? getBlockValue(valBlock, lang) : '128';
        if (lang === 'arduino') {
          if (board === 'ESP32 DevKit V1') {
            code += `${indent}analogWriteFrequency(${pin}, ${freq});\n`;
          }
          code += `${indent}analogWrite(${pin}, ${value});\n`;
        } else {
          if (board === 'BBC micro:bit') {
            code += `${indent}pin${pin}.write_analog(${value})\n`;
          } else {
            code += `${indent}pwm${pin}.duty(${value})\n`;
          }
        }
      } else if (currentBlock.type === 'arduino_serial_print') {
        const textBlock = currentBlock.getInputTargetBlock('TEXT');
        const valStr = textBlock ? getBlockValue(textBlock, lang) : '"Telemetry print"';
        if (lang === 'arduino') {
          code += `${indent}Serial.println(${valStr});\n`;
        } else {
          code += `${indent}print(${valStr})\n`;
        }
      } else if (currentBlock.type === 'arduino_serial_print_inline') {
        const textBlock = currentBlock.getInputTargetBlock('TEXT');
        const valStr = textBlock ? getBlockValue(textBlock, lang) : '"Telemetry print"';
        if (lang === 'arduino') {
          code += `${indent}Serial.print(${valStr});\n`;
        } else {
          code += `${indent}print(${valStr}, end='')\n`;
        }
      } else if (currentBlock.type === 'arduino_servo_write') {
        const pin = currentBlock.getFieldValue('PIN');
        const angleBlock = currentBlock.getInputTargetBlock('ANGLE');
        const angleVal = angleBlock ? getBlockValue(angleBlock, lang) : '90';
        if (lang === 'arduino') {
          const cleanPin = pin.toString().replace(/[^a-zA-Z0-9_]/g, '');
          const varName = `myServo${cleanPin}`;
          code += `${indent}${varName}.write(${angleVal});\n`;
        } else {
          if (board === 'BBC micro:bit') {
            const cleanPin = pin.toString().replace(/\D/g, '');
            code += `${indent}if 'pin${cleanPin}_servo' not in globals():\n`;
            code += `${indent}    pin${cleanPin}.set_analog_period(20)\n`;
            code += `${indent}    pin${cleanPin}_servo = True\n`;
            code += `${indent}pin${cleanPin}.write_analog(int(30 + (${angleVal} * 90) / 180)) # Servo\n`;
          } else {
            code += `${indent}servo_write(${pin}, ${angleVal})\n`;
          }
        }
      } else if (currentBlock.type === 'arduino_tone') {
        const pin = currentBlock.getFieldValue('PIN');
        const freq = getBlockValue(currentBlock.getInputTargetBlock('FREQ')!, lang);
        const dur = getBlockValue(currentBlock.getInputTargetBlock('DURATION')!, lang);
        if (lang === 'arduino') {
          code += `${indent}tone(${pin}, ${freq || 1000}, ${dur || 500});\n`;
        } else {
          code += `${indent}tone(${pin}, ${freq || 1000}, ${dur || 500})\n`;
        }
      } else if (currentBlock.type === 'arduino_notone') {
        const pin = currentBlock.getFieldValue('PIN');
        if (lang === 'arduino') {
          code += `${indent}noTone(${pin});\n`;
        } else {
          code += `${indent}no_tone(${pin})\n`;
        }
      } else if (currentBlock.type === 'procedures_callnoreturn') {
        const funcName = currentBlock.getFieldValue('NAME') || 'myFunction';
        const args: string[] = [];
        let i = 0;
        while (currentBlock.getInput('ARG' + i)) {
          const argBlock = currentBlock.getInputTargetBlock('ARG' + i);
          args.push(argBlock ? getBlockValue(argBlock, lang) : '0');
          i++;
        }
        if (lang === 'arduino') {
          code += `${indent}${funcName}(${args.join(', ')});\n`;
        } else {
          code += `${indent}${funcName}(${args.join(', ')})\n`;
        }
      } else if (currentBlock.type === 'procedures_ifreturn') {
        const condBlock = currentBlock.getInputTargetBlock('CONDITION');
        const valBlock = currentBlock.getInputTargetBlock('VALUE');
        const condVal = condBlock ? getBlockValue(condBlock, lang) : (lang === 'arduino' ? 'true' : 'True');
        const retVal = valBlock ? getBlockValue(valBlock, lang) : '';
        if (lang === 'arduino') {
          code += `${indent}if (${condVal}) return${retVal ? ' ' + retVal : ''};\n`;
        } else {
          code += `${indent}if ${condVal}:\n${indent}    return${retVal ? ' ' + retVal : ''}\n`;
        }
      } else if (currentBlock.type === 'controls_if') {
        const condBlock0 = currentBlock.getInputTargetBlock('IF0');
        const condVal0 = condBlock0 ? getBlockValue(condBlock0, lang) : (lang === 'arduino' ? 'true' : 'True');
        
        if (lang === 'arduino') {
          code += `${indent}if (${condVal0}) {\n`;
          const doBlock0 = currentBlock.getInputTargetBlock('DO0');
          if (doBlock0) {
            code += generateBlockCode(doBlock0, indent + '  ', 'arduino');
          }
          
          let i = 1;
          while (currentBlock.getInput(`IF${i}`)) {
            const condBlockI = currentBlock.getInputTargetBlock(`IF${i}`);
            const condValI = condBlockI ? getBlockValue(condBlockI, lang) : 'true';
            code += `${indent}} else if (${condValI}) {\n`;
            const doBlockI = currentBlock.getInputTargetBlock(`DO${i}`);
            if (doBlockI) {
              code += generateBlockCode(doBlockI, indent + '  ', 'arduino');
            }
            i++;
          }
          
          const elseBlock = currentBlock.getInputTargetBlock('ELSE');
          if (elseBlock) {
            code += `${indent}} else {\n`;
            code += generateBlockCode(elseBlock, indent + '  ', 'arduino');
          }
          code += `${indent}}\n`;
        } else {
          code += `${indent}if ${condVal0}:\n`;
          const doBlock0 = currentBlock.getInputTargetBlock('DO0');
          if (doBlock0) {
            code += generateBlockCode(doBlock0, indent + '    ', 'python');
          } else {
            code += `${indent}    pass\n`;
          }
          
          let i = 1;
          while (currentBlock.getInput(`IF${i}`)) {
            const condBlockI = currentBlock.getInputTargetBlock(`IF${i}`);
            const condValI = condBlockI ? getBlockValue(condBlockI, lang) : 'True';
            code += `${indent}elif ${condValI}:\n`;
            const doBlockI = currentBlock.getInputTargetBlock(`DO${i}`);
            if (doBlockI) {
              code += generateBlockCode(doBlockI, indent + '    ', 'python');
            } else {
              code += `${indent}    pass\n`;
            }
            i++;
          }
          
          const elseBlock = currentBlock.getInputTargetBlock('ELSE');
          if (elseBlock) {
            code += `${indent}else:\n`;
            code += generateBlockCode(elseBlock, indent + '    ', 'python');
          }
        }
      } else if (currentBlock.type === 'esp32_wifi_connect') {
        const ssidBlock = currentBlock.getInputTargetBlock('SSID');
        const passBlock = currentBlock.getInputTargetBlock('PASS');
        const ssid = ssidBlock ? getBlockValue(ssidBlock, lang) : '"WiFi_SSID"';
        const pass = passBlock ? getBlockValue(passBlock, lang) : '"WiFi_PASSWORD"';
        if (lang === 'arduino') {
          code += `${indent}WiFi.begin(${ssid}, ${pass});\n`;
          code += `${indent}while (WiFi.status() != WL_CONNECTED) {\n`;
          code += `${indent}  delay(500);\n`;
          code += `${indent}  Serial.print(".");\n`;
          code += `${indent}}\n`;
          code += `${indent}Serial.println("Connected!");\n`;
        } else {
          code += `${indent}robot.wifi_connect(${ssid}, ${pass})\n`;
        }
      } else if (currentBlock.type === 'esp32_websocket_connect') {
        const hostBlock = currentBlock.getInputTargetBlock('HOST');
        const portBlock = currentBlock.getInputTargetBlock('PORT');
        const pathBlock = currentBlock.getInputTargetBlock('PATH');
        const host = hostBlock ? getBlockValue(hostBlock, lang) : '""';
        const port = portBlock ? getBlockValue(portBlock, lang) : '80';
        const path = pathBlock ? getBlockValue(pathBlock, lang) : '"/"';
        if (lang === 'arduino') {
          code += `${indent}String _ws_host = ${host};\n`;
          code += `${indent}bool _ws_ssl = String(${port}) == "443" || _ws_host.startsWith("wss://") || _ws_host.startsWith("https://");\n`;
          code += `${indent}_ws_host.replace("https://", ""); _ws_host.replace("http://", ""); _ws_host.replace("wss://", ""); _ws_host.replace("ws://", "");\n`;
          code += `${indent}int _slash = _ws_host.indexOf('/'); if (_slash >= 0) _ws_host = _ws_host.substring(0, _slash);\n`;
          code += `${indent}if (_ws_ssl) {\n`;
          code += `${indent}  webSocket.beginSSL(_ws_host.c_str(), ${port}, ${path});\n`;
          code += `${indent}} else {\n`;
          code += `${indent}  webSocket.begin(_ws_host.c_str(), ${port}, ${path});\n`;
          code += `${indent}}\n`;
          code += `${indent}webSocket.onEvent(webSocketEvent);\n`;
        } else {
          code += `${indent}robot.websocket_connect(${host}, ${port}, ${path})\n`;
        }
      } else if (currentBlock.type === 'esp32_websocket_loop') {
        if (lang === 'arduino') {
          code += `${indent}webSocket.loop();\n`;
        } else {
          code += `${indent}robot.websocket_loop()\n`;
        }
      } else if (currentBlock.type === 'esp32_websocket_send') {
        const textBlock = currentBlock.getInputTargetBlock('TEXT');
        const text = textBlock ? getBlockValue(textBlock, lang) : '""';
        if (lang === 'arduino') {
          code += `${indent}webSocket.sendTXT(${text});\n`;
        } else {
          code += `${indent}robot.websocket_send(${text})\n`;
        }
      } else if (currentBlock.type === 'blynk_config') {
        // Rendered at top of file before Blynk includes
        code += '';
      } else if (currentBlock.type === 'blynk_begin') {
        const authBlock = currentBlock.getInputTargetBlock('AUTH');
        const ssidBlock = currentBlock.getInputTargetBlock('SSID');
        const passBlock = currentBlock.getInputTargetBlock('PASS');
        let auth = authBlock ? getBlockValue(authBlock, lang) : 'BLYNK_AUTH_TOKEN';
        if (auth === '""' || auth === '"YourAuthToken"') {
          auth = 'BLYNK_AUTH_TOKEN';
        }
        const ssid = ssidBlock ? getBlockValue(ssidBlock, lang) : '"MyWiFi"';
        const pass = passBlock ? getBlockValue(passBlock, lang) : '"password123"';
        if (lang === 'arduino') {
          code += `${indent}Blynk.begin(${auth}, ${ssid}, ${pass});\n`;
        } else {
          code += `${indent}robot.blynk_begin(${auth}, ${ssid}, ${pass})\n`;
        }
      } else if (currentBlock.type === 'blynk_run') {
        if (lang === 'arduino') {
          code += `${indent}Blynk.run();\n`;
        } else {
          code += `${indent}robot.blynk_run()\n`;
        }
      } else if (currentBlock.type === 'blynk_virtual_write') {
        const vpin = currentBlock.getFieldValue('VPIN') || 'V0';
        const valBlock = currentBlock.getInputTargetBlock('VALUE');
        const val = valBlock ? getBlockValue(valBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}Blynk.virtualWrite(${vpin}, ${val});\n`;
        } else {
          code += `${indent}robot.blynk_virtual_write("${vpin}", ${val})\n`;
        }
      } else if (currentBlock.type === 'dht_init') {
        const pin = currentBlock.getFieldValue('PIN');
        const type = currentBlock.getFieldValue('TYPE');
        if (lang === 'arduino') {
          code += `${indent}dht.begin();\n`;
        } else {
          code += `${indent}robot.dht_init(${pin}, "${type}")\n`;
        }
      } else if (currentBlock.type === 'mpu6050_init') {
        if (lang === 'arduino') {
          code += `${indent}if (!mpu.begin()) {\n`;
          code += `${indent}  Serial.println("Failed to find MPU6050 chip");\n`;
          code += `${indent}}\n`;
        } else {
          code += `${indent}robot.mpu_init()\n`;
        }
      } else if (
        currentBlock.type === 'lib_rfid_begin' || 
        currentBlock.type.toLowerCase().includes('rfid') || 
        currentBlock.type.toLowerCase().includes('pn532') || 
        currentBlock.type.toLowerCase().includes('nfc')
      ) {
        const cType = currentBlock.type.toLowerCase();
        if (cType.includes('print_uid') || cType.includes('print')) {
          if (lang === 'arduino') {
            code += `${indent}String cardUID = getRFIDUID();\n`;
            code += `${indent}if (cardUID != "") {\n`;
            code += `${indent}  if (!cardPresent) {\n`;
            code += `${indent}    cardPresent = true;\n`;
            code += `${indent}    Serial.println("==========================================");\n`;
            code += `${indent}    Serial.println("CARD DETECTED");\n`;
            code += `${indent}    Serial.print("UID : ");\n`;
            code += `${indent}    Serial.println(cardUID);\n`;
            code += `${indent}    Serial.println("==========================================");\n`;
            code += `${indent}  }\n`;
            code += `${indent}} else {\n`;
            code += `${indent}  if (cardPresent) {\n`;
            code += `${indent}    Serial.println("Card Removed. Waiting for next card...");\n`;
            code += `${indent}    cardPresent = false;\n`;
            code += `${indent}  }\n`;
            code += `${indent}}\n`;
            code += `${indent}delay(100);\n`;
          } else {
            code += `${indent}robot.rfid_print_uid()\n`;
          }
        } else if (cType.includes('read')) {
          if (lang === 'arduino') {
            code += `${indent}Serial.println(getRFIDUID());\n`;
          } else {
            code += `${indent}robot.rfid_read()\n`;
          }
        } else if (cType.includes('iscard') || cType.includes('present')) {
          if (lang === 'arduino') {
            code += `${indent}(getRFIDUID() != "");\n`;
          } else {
            code += `${indent}robot.rfid_is_card()\n`;
          }
        } else {
          let sda = currentBlock.getField('SDA') ? currentBlock.getFieldValue('SDA') : null;
          let scl = currentBlock.getField('SCL') ? currentBlock.getFieldValue('SCL') : null;
          let irq = 'D3';
          let rst = 'D4';
          try {
            irq = currentBlock.getFieldValue('IRQ') || currentBlock.getFieldValue('PIN') || 'D3';
            rst = currentBlock.getFieldValue('RESET') || currentBlock.getFieldValue('RST') || 'D4';
          } catch (_) {}

          const currentBoardStr = boardRef.current || board || '';
          const isEsp8266Board = currentBoardStr.toLowerCase().includes('esp8266') || currentBoardStr.toLowerCase().includes('nodemcu');
          if (sda && isEsp8266Board && /^\d+$/.test(sda)) sda = `D${sda}`;
          if (scl && isEsp8266Board && /^\d+$/.test(scl)) scl = `D${scl}`;
          if (isEsp8266Board && /^\d+$/.test(irq)) irq = `D${irq}`;
          if (isEsp8266Board && /^\d+$/.test(rst)) rst = `D${rst}`;

          if (lang === 'arduino') {
            if (sda && scl) {
              code += `${indent}Wire.begin(SDA_PIN, SCL_PIN);\n`;
              code += `${indent}Wire.setClock(100000);\n`;
              code += `${indent}delay(100);\n\n`;
              code += `${indent}Serial.println("Initializing PN532...");\n`;
              code += `${indent}nfc.begin();\n\n`;
              code += `${indent}uint32_t versiondata = nfc.getFirmwareVersion();\n`;
              code += `${indent}if (!versiondata) {\n`;
              code += `${indent}  Serial.println("ERROR : PN532 NOT DETECTED (Periksa DIP Switch = I2C & Wiring SDA/SCL)");\n`;
              code += `${indent}  while (1) { delay(500); }\n`;
              code += `${indent}}\n\n`;
              code += `${indent}Serial.println("PN532 Successfully Detected");\n`;
              code += `${indent}Serial.print("Chip : PN5");\n`;
              code += `${indent}Serial.println((versiondata >> 24) & 0xFF, HEX);\n`;
              code += `${indent}nfc.SAMConfig();\n`;
              code += `${indent}Serial.println("NFC MODULE IS READY");\n`;
            } else {
              code += `${indent}nfc.begin();\n`;
              code += `${indent}uint32_t versiondata = nfc.getFirmwareVersion();\n`;
              code += `${indent}if (versiondata) {\n`;
              code += `${indent}  nfc.SAMConfig();\n`;
              code += `${indent}}\n`;
            }
          } else {
            code += `${indent}robot.rfid_begin("${sda || '4'}", "${scl || '5'}")\n`;
          }
        }
      } else if (currentBlock.type === 'lib_display_begin') {
        if (lang === 'arduino') {
          code += `${indent}display.begin(SSD1306_SWITCHCAPVCC, 0x3C);\n`;
        } else {
          code += `${indent}robot.display_begin()\n`;
        }
      } else if (currentBlock.type === 'lib_display_clear') {
        if (lang === 'arduino') {
          code += `${indent}display.clearDisplay();\n`;
        } else {
          code += `${indent}robot.display_clear()\n`;
        }
      } else if (currentBlock.type === 'lib_display_print') {
        const textBlock = currentBlock.getInputTargetBlock('TEXT');
        const valStr = textBlock ? getBlockValue(textBlock, lang) : '"Hello"';
        if (lang === 'arduino') {
          code += `${indent}display.println(${valStr});\n${indent}display.display();\n`;
        } else {
          code += `${indent}robot.display_print(${valStr})\n`;
        }
      } else if (currentBlock.type === 'lib_display_setcursor') {
        const x = currentBlock.getFieldValue('X') || 0;
        const y = currentBlock.getFieldValue('Y') || 0;
        if (lang === 'arduino') {
          code += `${indent}display.setCursor(${x}, ${y});\n`;
        } else {
          code += `${indent}robot.display_setcursor(${x}, ${y})\n`;
        }
      } else if (currentBlock.type === 'lib_fastled_begin') {
        const pin = currentBlock.getFieldValue('PIN') || 5;
        const num = currentBlock.getFieldValue('NUM') || 60;
        if (lang === 'arduino') {
          code += `${indent}FastLED.addLeds<WS2812, ${pin}, GRB>(leds, ${num});\n`;
        } else {
          code += `${indent}robot.fastled_begin(${pin}, ${num})\n`;
        }
      } else if (currentBlock.type === 'lib_fastled_show') {
        if (lang === 'arduino') {
          code += `${indent}FastLED.show();\n`;
        } else {
          code += `${indent}robot.fastled_show()\n`;
        }
      } else if (currentBlock.type === 'lib_fastled_setrgb') {
        const idx = currentBlock.getFieldValue('IDX') || 0;
        const r = currentBlock.getFieldValue('R') || 255;
        const g = currentBlock.getFieldValue('G') || 0;
        const b = currentBlock.getFieldValue('B') || 0;
        if (lang === 'arduino') {
          code += `${indent}leds[${idx}] = CRGB(${r}, ${g}, ${b});\n`;
        } else {
          code += `${indent}robot.fastled_setrgb(${idx}, ${r}, ${g}, ${b})\n`;
        }
      } else if (currentBlock.type === 'lib_fastled_brightness') {
        const val = currentBlock.getFieldValue('VAL') || 128;
        if (lang === 'arduino') {
          code += `${indent}FastLED.setBrightness(${val});\n`;
        } else {
          code += `${indent}robot.fastled_brightness(${val})\n`;
        }
      } else if (currentBlock.type === 'lib_stepper_begin') {
        const spd = currentBlock.getFieldValue('STEPS') || 200;
        if (lang === 'arduino') {
          code += `${indent}stepper.setSpeed(100);\n`;
        } else {
          code += `${indent}robot.stepper_begin(${spd})\n`;
        }
      } else if (currentBlock.type === 'lib_stepper_setspeed') {
        const spd = currentBlock.getFieldValue('SPD') || 100;
        if (lang === 'arduino') {
          code += `${indent}stepper.setSpeed(${spd});\n`;
        } else {
          code += `${indent}robot.stepper_setspeed(${spd})\n`;
        }
      } else if (currentBlock.type === 'lib_stepper_step') {
        const n = currentBlock.getFieldValue('N') || 100;
        if (lang === 'arduino') {
          code += `${indent}stepper.step(${n});\n`;
        } else {
          code += `${indent}robot.stepper_step(${n})\n`;
        }
      } else if (currentBlock.type === 'lib_sd_begin') {
        const pin = currentBlock.getFieldValue('PIN') || 5;
        if (lang === 'arduino') {
          code += `${indent}SD.begin(${pin});\n`;
        } else {
          code += `${indent}robot.sd_begin(${pin})\n`;
        }
      } else if (currentBlock.type === 'lib_sd_open') {
        const nameBlock = currentBlock.getInputTargetBlock('NAME');
        const name = nameBlock ? getBlockValue(nameBlock, lang) : '"test.txt"';
        if (lang === 'arduino') {
          code += `${indent}myFile = SD.open(${name}, FILE_WRITE);\n`;
        } else {
          code += `${indent}robot.sd_open(${name})\n`;
        }
      } else if (currentBlock.type === 'lib_sd_write') {
        const dataBlock = currentBlock.getInputTargetBlock('DATA');
        const data = dataBlock ? getBlockValue(dataBlock, lang) : '"data"';
        if (lang === 'arduino') {
          code += `${indent}if (myFile) { myFile.println(${data}); }\n`;
        } else {
          code += `${indent}robot.sd_write(${data})\n`;
        }
      } else if (currentBlock.type === 'lib_sd_close') {
        if (lang === 'arduino') {
          code += `${indent}if (myFile) { myFile.close(); }\n`;
        } else {
          code += `${indent}robot.sd_close()\n`;
        }
      } else if (currentBlock.type === 'lib_bme_begin') {
        if (lang === 'arduino') {
          code += `${indent}bme.begin(0x76);\n`;
        } else {
          code += `${indent}robot.bme_begin()\n`;
        }
      } else if (currentBlock.type === 'lib_gps_begin') {
        const baud = currentBlock.getFieldValue('BAUD') || 9600;
        if (lang === 'arduino') {
          code += `${indent}ss.begin(${baud});\n`;
        } else {
          code += `${indent}robot.gps_begin(${baud})\n`;
        }
      } else if (currentBlock.type === 'lib_keypad_begin') {
        if (lang === 'arduino') {
          code += `${indent}// Keypad Initialized\n`;
        } else {
          code += `${indent}robot.keypad_begin()\n`;
        }
      } else if (currentBlock.type.startsWith('custom_')) {
        if (lang === 'arduino') {
          code += `${indent}// Custom library statement\n`;
        } else {
          code += `${indent}pass # Custom library statement\n`;
        }
      } else if (currentBlock.type === 'neopixel_init') {
        const pin = currentBlock.getFieldValue('PIN');
        const num = currentBlock.getFieldValue('NUM');
        if (lang === 'arduino') {
          code += `${indent}pixels.begin();\n`;
        } else {
          code += `${indent}robot.neopixel_init(${pin}, ${num})\n`;
        }
      } else if (currentBlock.type === 'neopixel_set_color') {
        const idxBlock = currentBlock.getInputTargetBlock('INDEX');
        const rBlock = currentBlock.getInputTargetBlock('R');
        const gBlock = currentBlock.getInputTargetBlock('G');
        const bBlock = currentBlock.getInputTargetBlock('B');
        const idx = idxBlock ? getBlockValue(idxBlock, lang) : '0';
        const r = rBlock ? getBlockValue(rBlock, lang) : '255';
        const g = gBlock ? getBlockValue(gBlock, lang) : '0';
        const b = bBlock ? getBlockValue(bBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}pixels.setPixelColor(${idx}, pixels.Color(${r}, ${g}, ${b}));\n`;
        } else {
          code += `${indent}robot.neopixel_set_color(${idx}, ${r}, ${g}, ${b})\n`;
        }
      } else if (currentBlock.type === 'neopixel_show') {
        if (lang === 'arduino') {
          code += `${indent}pixels.show();\n`;
        } else {
          code += `${indent}robot.neopixel_show()\n`;
        }
      } else if (currentBlock.type === 'mqtt_init') {
        if (lang === 'arduino') {
          code += `${indent}// client initialized globally\n`;
        } else {
          code += `${indent}robot.mqtt_init()\n`;
        }
      } else if (currentBlock.type === 'mqtt_publish') {
        const topicBlock = currentBlock.getInputTargetBlock('TOPIC');
        const msgBlock = currentBlock.getInputTargetBlock('MSG');
        const topic = topicBlock ? getBlockValue(topicBlock, lang) : '"topic"';
        const msg = msgBlock ? getBlockValue(msgBlock, lang) : '"msg"';
        if (lang === 'arduino') {
          code += `${indent}client.publish(${topic}, ${msg});\n`;
        } else {
          code += `${indent}robot.mqtt_publish(${topic}, ${msg})\n`;
        }
      } else if (currentBlock.type === 'mqtt_subscribe') {
        const topicBlock = currentBlock.getInputTargetBlock('TOPIC');
        const topic = topicBlock ? getBlockValue(topicBlock, lang) : '"topic"';
        if (lang === 'arduino') {
          code += `${indent}client.subscribe(${topic});\n`;
        } else {
          code += `${indent}robot.mqtt_subscribe(${topic})\n`;
        }
      } else if (currentBlock.type === 'esp32_bluetooth_begin') {
        const nameBlock = currentBlock.getInputTargetBlock('NAME');
        const btName = nameBlock ? getBlockValue(nameBlock, lang) : '"ESP32_BT"';
        if (lang === 'arduino') {
          code += `${indent}SerialBT.begin(${btName});\n`;
        } else {
          code += `${indent}robot.bluetooth_begin(${btName})\n`;
        }
      } else if (currentBlock.type === 'esp32_bluetooth_write') {
        const dataBlock = currentBlock.getInputTargetBlock('DATA');
        const dataVal = dataBlock ? getBlockValue(dataBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}SerialBT.write(${dataVal});\n`;
        } else {
          code += `${indent}robot.bluetooth_write(${dataVal})\n`;
        }
      } else if (currentBlock.type === 'variables_set') {
        const varName = currentBlock.getField('VAR')?.getText() || 'x';
        const valBlock = currentBlock.getInputTargetBlock('VALUE');
        const valStr = valBlock ? getBlockValue(valBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}${varName} = ${valStr};\n`;
        } else {
          code += `${indent}${varName} = ${valStr}\n`;
        }
      } else if (currentBlock.type === 'controls_repeat_ext') {
        const timesBlock = currentBlock.getInputTargetBlock('TIMES');
        const times = timesBlock ? getBlockValue(timesBlock, lang) : '10';
        const doBlock = currentBlock.getInputTargetBlock('DO');
        if (lang === 'arduino') {
          code += `${indent}for (int i = 0; i < ${times}; i++) {\n`;
          if (doBlock) {
            code += generateBlockCode(doBlock, indent + '  ', 'arduino');
          }
          code += `${indent}}\n`;
        } else {
          code += `${indent}for i in range(${times}):\n`;
          if (doBlock) {
            code += generateBlockCode(doBlock, indent + '    ', 'python');
          } else {
            code += `${indent}    pass\n`;
          }
        }
      } else if (currentBlock.type === 'controls_whileUntil') {
        const mode = currentBlock.getFieldValue('MODE') || 'WHILE';
        const condBlock = currentBlock.getInputTargetBlock('BOOL');
        const cond = condBlock ? getBlockValue(condBlock, lang) : (lang === 'arduino' ? 'true' : 'True');
        const doBlock = currentBlock.getInputTargetBlock('DO');
        if (lang === 'arduino') {
          if (mode === 'WHILE') {
            code += `${indent}while (${cond}) {\n`;
          } else {
            code += `${indent}while (!(${cond})) {\n`;
          }
          if (doBlock) {
            code += generateBlockCode(doBlock, indent + '  ', 'arduino');
          }
          code += `${indent}}\n`;
        } else {
          if (mode === 'WHILE') {
            code += `${indent}while ${cond}:\n`;
          } else {
            code += `${indent}while not ${cond}:\n`;
          }
          if (doBlock) {
            code += generateBlockCode(doBlock, indent + '    ', 'python');
          } else {
            code += `${indent}    pass\n`;
          }
        }
      } else if (currentBlock.type === 'controls_for') {
        const varName = currentBlock.getField('VAR')?.getText() || 'i';
        const fromBlock = currentBlock.getInputTargetBlock('FROM');
        const toBlock = currentBlock.getInputTargetBlock('TO');
        const byBlock = currentBlock.getInputTargetBlock('BY');
        const fromVal = fromBlock ? getBlockValue(fromBlock, lang) : '1';
        const toVal = toBlock ? getBlockValue(toBlock, lang) : '10';
        const byVal = byBlock ? getBlockValue(byBlock, lang) : '1';
        const doBlock = currentBlock.getInputTargetBlock('DO');
        if (lang === 'arduino') {
          code += `${indent}for (int ${varName} = ${fromVal}; ${varName} <= ${toVal}; ${varName} += ${byVal}) {\n`;
          if (doBlock) {
            code += generateBlockCode(doBlock, indent + '  ', 'arduino');
          }
          code += `${indent}}\n`;
        } else {
          code += `${indent}for ${varName} in range(${fromVal}, ${toVal} + 1, ${byVal}):\n`;
          if (doBlock) {
            code += generateBlockCode(doBlock, indent + '    ', 'python');
          } else {
            code += `${indent}    pass\n`;
          }
        }
      } else if (currentBlock.type === 'raw_code') {
        const raw = currentBlock.getFieldValue('CODE');
        code += `${indent}${raw}\n`;
      } else if (currentBlock.type === 'raw_statement') {
        const raw = currentBlock.getFieldValue('CODE');
        code += `${indent}${raw}\n`;
        const doBlock = currentBlock.getInputTargetBlock('STACK');
        if (doBlock) {
          code += generateBlockCode(doBlock, indent + '    ', 'python');
        } else {
          code += `${indent}    pass\n`;
        }
      }
      
      // Microbit E-Learning Statements
      else if (currentBlock.type === 'basic_on_start') {
        const handlerBlock = currentBlock.getInputTargetBlock('HANDLER');
        const handlerCode = handlerBlock ? generateBlockCode(handlerBlock, indent, lang) : '';
        if (lang === 'arduino') {
          code += `${indent}// saat mulai\n${handlerCode}`;
        } else {
          code += `${indent}# saat mulai\n${handlerCode}`;
        }
      } else if (currentBlock.type === 'basic_forever') {
        const handlerBlock = currentBlock.getInputTargetBlock('HANDLER');
        const handlerCode = handlerBlock ? generateBlockCode(handlerBlock, indent + '    ', lang) : `${indent}    pass\n`;
        if (lang === 'arduino') {
          code += `${indent}// selamanya\n${handlerCode}`;
        } else {
          code += `${indent}while True:\n${handlerCode}`;
        }
      } else if (currentBlock.type === 'basic_show_string') {
        const valBlock = currentBlock.getInputTargetBlock('TEXT');
        const val = valBlock ? getBlockValue(valBlock, lang) : '""';
        if (lang === 'arduino') {
          code += `${indent}Microbit.showString(${val});\n`;
        } else {
          code += `${indent}display.scroll(${val})\n`;
        }
      } else if (currentBlock.type === 'basic_show_number') {
        const valBlock = currentBlock.getInputTargetBlock('NUMBER');
        const val = valBlock ? getBlockValue(valBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}Microbit.showNumber(${val});\n`;
        } else {
          code += `${indent}display.show(${val})\n`;
        }
      } else if (currentBlock.type === 'basic_show_leds') {
        if (lang === 'arduino') {
          code += `${indent}// tampilkan LED\n`;
        } else {
          const gridRows: string[] = [];
          for (let r = 0; r < 5; r++) {
            let rowVal = '';
            for (let c = 0; c < 5; c++) {
              rowVal += currentBlock.getFieldValue(`LED${c}${r}`) === 'TRUE' ? '9' : '0';
            }
            gridRows.push(rowVal);
          }
          const imgStr = gridRows.join(':');
          code += `${indent}display.show(Image("${imgStr}"))\n`;
        }
      } else if (currentBlock.type === 'basic_show_icon') {
        const icon = currentBlock.getFieldValue('ICON');
        if (lang === 'arduino') {
          code += `${indent}Microbit.showIcon("${icon}");\n`;
        } else {
          code += `${indent}display.show(Image.${icon.toUpperCase()})\n`;
        }
      } else if (currentBlock.type === 'basic_clear_screen') {
        if (lang === 'arduino') {
          code += `${indent}Microbit.clearScreen();\n`;
        } else {
          code += `${indent}display.clear()\n`;
        }
      } else if (currentBlock.type === 'basic_pause') {
        const valBlock = currentBlock.getInputTargetBlock('MS');
        const val = valBlock ? getBlockValue(valBlock, lang) : '500';
        if (lang === 'arduino') {
          code += `${indent}delay(${val});\n`;
        } else if (board === 'BBC micro:bit') {
          // micro:bit: sleep() dari 'from microbit import *', argumen dalam MILIDETIK
          code += `${indent}sleep(${val})\n`;
        } else {
          // ESP32 / MicroPython: time.sleep() dalam DETIK
          code += `${indent}time.sleep(${parseFloat(val || '500') / 1000.0})\n`;
        }
      } else if (currentBlock.type === 'input_on_button_pressed') {
        const btn = currentBlock.getFieldValue('BUTTON');
        const handlerBlock = currentBlock.getInputTargetBlock('HANDLER');
        const handlerCode = handlerBlock ? generateBlockCode(handlerBlock, indent + '    ', lang) : `${indent}    pass\n`;
        if (lang === 'arduino') {
          code += `${indent}// ketika tombol ${btn} ditekan\n`;
        } else {
          code += `${indent}if button_${btn.toLowerCase()}.is_pressed():\n${handlerCode}`;
        }
      } else if (currentBlock.type === 'input_on_gesture') {
        const gesture = currentBlock.getFieldValue('GESTURE');
        const handlerBlock = currentBlock.getInputTargetBlock('HANDLER');
        const handlerCode = handlerBlock ? generateBlockCode(handlerBlock, indent + '    ', lang) : `${indent}    pass\n`;
        if (lang === 'arduino') {
          code += `${indent}// ketika ${gesture}\n`;
        } else {
          code += `${indent}if accelerometer.was_gesture("${gesture}"):\n${handlerCode}`;
        }
      } else if (currentBlock.type === 'music_play_tone') {
        const noteBlock = currentBlock.getInputTargetBlock('NOTE');
        const note = noteBlock ? getBlockValue(noteBlock, lang) : '440';
        const durBlock = currentBlock.getInputTargetBlock('DURATION');
        const dur = durBlock ? getBlockValue(durBlock, lang) : '500';
        if (lang === 'arduino') {
          code += `${indent}tone(PIN_BUZZER, ${note}, ${dur});\n`;
        } else {
          code += `${indent}music.pitch(${note}, ${dur})\n`;
        }
      } else if (currentBlock.type === 'radio_send_number') {
        const numBlock = currentBlock.getInputTargetBlock('NUM');
        const num = numBlock ? getBlockValue(numBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}Radio.sendNumber(${num});\n`;
        } else {
          code += `${indent}radio.send(str(${num}))\n`;
        }
      } else if (currentBlock.type === 'pins_digital_write') {
        const pin = currentBlock.getFieldValue('PIN');
        const valBlock = currentBlock.getInputTargetBlock('VALUE');
        const val = valBlock ? getBlockValue(valBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}digitalWrite(${pin}, ${val});\n`;
        } else {
          const pinNum = pin.replace(/\D/g, '');
          code += `${indent}pin${pinNum}.write_digital(${val})\n`;
        }
      } else if (currentBlock.type === 'pins_analog_write') {
        const pin = currentBlock.getFieldValue('PIN');
        const valBlock = currentBlock.getInputTargetBlock('VALUE');
        const val = valBlock ? getBlockValue(valBlock, lang) : '0';
        if (lang === 'arduino') {
          code += `${indent}analogWrite(${pin}, ${val});\n`;
        } else {
          const pinNum = pin.replace(/\D/g, '');
          code += `${indent}pin${pinNum}.write_analog(${val})\n`;
        }
      } else if (currentBlock.type === 'pins_servo_write') {
        const pin = currentBlock.getFieldValue('PIN');
        const valBlock = currentBlock.getInputTargetBlock('VALUE');
        const val = valBlock ? getBlockValue(valBlock, lang) : '0';
        if (lang === 'arduino') {
          const cleanPin = pin.toString().replace(/[^a-zA-Z0-9_]/g, '');
          const varName = `myServo${cleanPin}`;
          code += `${indent}${varName}.write(${val});\n`;
        } else {
          const pinNum = pin.replace(/\D/g, '');
          if (board === 'BBC micro:bit') {
            code += `${indent}if 'pin${pinNum}_servo' not in globals():\n`;
            code += `${indent}    pin${pinNum}.set_analog_period(20)\n`;
            code += `${indent}    pin${pinNum}_servo = True\n`;
            code += `${indent}pin${pinNum}.write_analog(int(30 + (${val} * 90) / 180)) # Servo\n`;
          } else {
            code += `${indent}pin${pinNum}.write_analog(${val}) # Servo\n`;
          }
        }
      }

      // Move to the next connected block
      currentBlock = currentBlock.getNextBlock();
    }

    return code;
  };

  const isLight = themeMode === 'light';

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col ${isLight ? 'bg-white' : 'bg-[#08090d]'} ${compact ? 'compact-blockly' : ''}`}>
      {/* ✨ Premium Glassmorphism Toolbar */}
      <div className={`flex items-center justify-between backdrop-blur-md border-b ${isLight ? 'bg-white/90 border-slate-200' : 'bg-[#0b0d14]/95 border-slate-800/80'} ${compact ? 'px-3 py-1.5' : 'px-4 py-3'} z-20 shadow-sm relative`}>
        <div className="flex items-center gap-2">
          <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-400'} uppercase tracking-widest flex items-center gap-1.5`}>
            <Blocks className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            Visual Block
          </span>
        </div>
        
        <div className="flex gap-1.5 items-center">
          {!isSyncWithBlocks && (
            <button
              onClick={() => {
                const arduinoCode = generateCodeForLang('arduino', boardRef.current);
                const pythonCode = generateCodeForLang('python', boardRef.current);
                if (onSyncToCode) {
                  onSyncToCode(arduinoCode, pythonCode);
                }
                if (onCodeChange) {
                  onCodeChange(codeType === 'arduino' ? arduinoCode : pythonCode, codeType === 'arduino' ? pythonCode : arduinoCode);
                }
                if (workspaceRef.current) {
                  Blockly.svgResize(workspaceRef.current);
                }
              }}
              className={`text-[10px] border ${isLight ? 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100' : 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25'} ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer shadow-sm`}
              title="Sinkronkan susunan block saat ini ke kode editor"
            >
              Sinkron ke Kode
            </button>
          )}

          {onRunSimulator && onStopSimulator && (
            isRunning ? (
              <button 
                onClick={onStopSimulator}
                className={`text-[10px] border ${isLight ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'} ${compact ? 'px-2.5 py-1' : 'px-4 py-1.5'} rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer shadow-sm`}
                title="Stop simulation"
              >
                <Square className="w-3 h-3 fill-current" /> Stop Sim
              </button>
            ) : (
              <button 
                onClick={() => onRunSimulator?.(latestCodeRef.current)}
                className={`text-[10px] border ${isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'} ${compact ? 'px-2.5 py-1' : 'px-4 py-1.5'} rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer shadow-sm`}
                title="Run simulation"
              >
                <Play className="w-3 h-3 fill-current" /> Run Sim
              </button>
            )
          )}
          
          <div className={`h-3.5 w-px ${isLight ? 'bg-slate-200' : 'bg-slate-700/80'} mx-0.5`}></div>

          <button 
            onClick={() => {
              if (workspaceRef.current) {
                workspaceRef.current.setScale(compact ? 0.72 : 0.85);
                workspaceRef.current.scrollCenter();
              }
            }}
            className={`flex items-center gap-1 text-[10px] font-bold border ${isLight ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-[#151824] text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white'} ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-full transition cursor-pointer shadow-sm`}
          >
            <RotateCcw className="w-3 h-3" />
            Reset View
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Clear all blocks?")) {
                if (workspaceRef.current) {
                  workspaceRef.current.clear();
                }
              }
            }}
            className={`flex items-center gap-1 text-[10px] font-bold border ${isLight ? 'bg-white text-rose-500 border-slate-200 hover:bg-rose-50 hover:border-rose-200' : 'bg-[#151824] text-rose-400 border-slate-700/80 hover:bg-rose-500/15 hover:border-rose-500/40'} ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-full transition cursor-pointer shadow-sm`}
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative z-10">
        <div ref={blocklyDivRef} className="w-full h-full" />
      </div>
    </div>
  );
};

