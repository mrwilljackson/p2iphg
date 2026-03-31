flowchart TD
    A([I need to register]) --> B{What is my Role?}

    B -->|Participant| C1[only **open** groups shown]
    B -->|Group| C2[**All** groups shown]
    B -->|Helper| C4[**All** helper emails shown]

    C1 --> D1([Choose group from pulldown])
    C2 --> D2([Choose group from pulldown])
    C4 --> D4([Choose email from pulldown])

    D1 --> |If group not listed get help|E1([Add email and first/last name])
    D2 --> |If group not listed get help|E2([Select email and check first/last name])
    D4 -->|If email not listed get help|E4([Email Consent
Photo consent])

    E1 --> F1([Do you consider yourself impaired?])
    E2 --> |Amend email and name if needed|F2([Click to continue])
    E4 --> F4([Click Register])

    F1 --> G0([photo consent
email consent])

    F2 -->|**Open** group| G1([I will/not be participating ])
    F2 -->|**Closed** group| G2([I will/not be participating])
    F2 -->|**Family** group| G3([I will/not be participating ])
    F4 -->G4@{ shape: framed-circle, label: "Stop" }

    G0 -->H0([Click Register])
    G1 -->H1([how many in your group excluding yourself?])
    G2 -->H2([how many overall, disabled, SEN in your group excluding yourself?])
    G3 -->H3([how many in your family group excluding yourself?])

    H0 --> I0@{ shape: framed-circle, label: "Stop" }
    H1 --> I1([photo consent
email consent])
    H2 --> I2([agree to wristband use to withdraw photo consent])
    H3 --> I3([photo consent
email consent])
    
    I1 --> J1([Click Register])
    I2 --> J2([email consent])
    I3 --> J3([Click Register])

    J1 --> K1@{ shape: framed-circle, label: "Stop" }
    J2 --> K2([Click to Register])
    J3 --> K3@{ shape: framed-circle, label: "Stop" }

    K2 --> L2@{ shape: framed-circle, label: "Stop" }
