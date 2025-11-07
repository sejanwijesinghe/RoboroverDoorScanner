// ===============================================
//  ROBO ROVER DUAL DOOR CONTROL – Arduino (Uno/Nano)
//  Opens on START_DOOR, Closes on CLOSE_DOOR
//  Each door uses a separate L298N motor driver
// ===============================================

// Motor A -> Driver 1 (Door 1)
#define ENA 9
#define IN1 8
#define IN2 7

// Motor B -> Driver 2 (Door 2)
#define ENB 10
#define IN3 6
#define IN4 5

// ------------------------------------------------
//  FUNCTION PROTOTYPES
// ------------------------------------------------
void runMotorsTogether(int timeA, int timeB, bool forward = true);
void stopMotors();

// ------------------------------------------------
void setup() {
  Serial.begin(115200);

  // Motor A
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  // Motor B
  pinMode(ENB, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  stopMotors();
  Serial.println("Dual Motor Door System Ready");
}

// ------------------------------------------------
void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "START_DOOR") {
      Serial.println("DOOR_OPENING...");
      runMotorsTogether(5000, 5000, true);   // Forward = Open both
      Serial.println("DOOR_OPENED");
    }
    else if (cmd == "CLOSE_DOOR") {
      Serial.println("DOOR_CLOSING...");
      runMotorsTogether(5000, 5000, false);  // Reverse = Close both
      Serial.println("DOOR_CLOSED");
    }
    else if (cmd == "STOP_DOOR") {
      stopMotors();
      Serial.println("DOOR_STOPPED");
    }
  }
}

// ------------------------------------------------
//  MOTOR CONTROL FUNCTION (Full Speed, No PWM)
// ------------------------------------------------
void runMotorsTogether(int timeA, int timeB, bool forward) {
  // Set direction for both
  digitalWrite(IN1, forward ? HIGH : LOW);
  digitalWrite(IN2, forward ? LOW  : HIGH);

  digitalWrite(IN3, forward ? HIGH : LOW);
  digitalWrite(IN4, forward ? LOW  : HIGH);

  // Run both full speed
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);

  unsigned long start = millis()
  int stoppedA = 0, stoppedB = 0;

  while (!stoppedA || !stoppedB) {
    unsigned long elapsed = millis() - start;
    if (!stoppedA && elapsed >= timeA) { digitalWrite(ENA, LOW); stoppedA = 1; }
    if (!stoppedB && elapsed >= timeB) { digitalWrite(ENB, LOW); stoppedB = 1; }
  }
}

// ------------------------------------------------
void stopMotors() {
  digitalWrite(ENA, LOW);
  digitalWrite(ENB, LOW);
}
