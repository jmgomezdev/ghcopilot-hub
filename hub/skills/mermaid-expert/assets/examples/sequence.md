# Mermaid Sequence Diagram Expert Guide

Sequence diagrams are used to show the interaction between actors and objects in a sequential order.

## 1. Basic Syntax

```mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: Async call
    John--)Alice: Async return
```

## 2. Participants & Actors
- **Participant**: Rectangular box (default).
- **Actor**: Stick figure.

```mermaid
sequenceDiagram
    actor A as Alice
    participant J as John
    A->>J: Hello
```

## 3. Activations
Show when a participant is active/processing.

```mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    activate John
    John-->>Alice: Great!
    deactivate John
```

**Shortcut `+`/`-`**:
```mermaid
sequenceDiagram
    Alice->>+John: Hello John, how are you?
    John-->>-Alice: Great!
```

## 4. Notes
Add notes to the diagram.

```mermaid
sequenceDiagram
    participant Alice
    participant John
    Note right of John: Text in note
    Note left of Alice: Text in note
    Note over Alice,John: Text over both
```

## 5. Loops, Alt, Opt
Logic blocks.

```mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    alt is sick
        John-->>Alice: Not so good :(
    else is well
        John-->>Alice: Feeling fresh like a daisy
    end
    opt Extra response
        John-->>Alice: Thanks for asking
    end
    loop Daily query
        Alice->>John: Hello John, how are you?
    end
```

## 6. EXPERT: Messages & Autonumbering

### Autonumber
```mermaid
sequenceDiagram
    autonumber
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

### Critical Region
```mermaid
sequenceDiagram
    critical Establish a connection to the DB
        Service-->DB: connect
    option Network issues
        Service-->DB: connect
    end
```

## 7. Configuration (Directives)

Customize spacing and actor usage.

```mermaid
%%{init: { 'theme': 'forest', 'sequence': { 'showSequenceNumbers': true, 'actorMargin': 50 } } }%%
sequenceDiagram
    Alice->>John: Hello John, how are you?
```
