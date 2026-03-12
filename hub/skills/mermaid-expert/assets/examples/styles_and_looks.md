# Mermaid Advanced Styling & Looks

Combine themes, looks, and variables for unique visual styles.

## 1. HandDrawn Sketch (Neutral)
Imitates a rough sketch on sticky notes. Great for brainstorming.

![HandDrawn Style](img/neutral_sketch.png)

```mermaid
%%{
  init: {
    'theme': 'neutral',
    'look': 'handDrawn'
  }
}%%
graph TD
    A[Idea] --> B{Valid?}
    B -- Yes --> C[Sketch It]
    B -- No --> D[Trash]
    style C fill:#a5d6a7,stroke:#2e7d32
```

## 2. Neo / Cyberpunk (Dark)
High contrast, neon colors.

![Neo Style](img/dark_neo.png)

```mermaid
%%{
  init: {
    'theme': 'dark',
    'look': 'neo'
  }
}%%
flowchart LR
    Start((Start)) --> Process[Processing Node]
    Process --> DB[(Database)]
    DB -.-> Cloud((Cloud Sync))
```

## 3. Corporate Clean (Forest)
Professional, clean lines, standard colors.

![Corporate Style](img/forest_corp.png)

```mermaid
%%{
  init: {
    'theme': 'forest',
    'look': 'classic'
  }
}%%
graph TB
    Manager -->|Reports to| Director
    Worker -->|Reports to| Manager
```

## 4. Minimalist (Base)
Very simple, high contrast black and white.

![Minimal Style](img/base_minimal.png)

```mermaid
%%{
  init: {
    'theme': 'base',
    'themeVariables': { 'primaryColor': '#ffffff', 'lineColor': '#333' } 
  }
}%%
classDiagram
    class Blueprint {
      +String dimensions
      +validate()
    }
```

## 5. Modern Sequence (Default + Neo)
A modern twist on standard sequence diagrams.

![Neo Sequence](img/default_neo.png)

```mermaid
%%{
  init: {
    'theme': 'default',
    'look': 'neo'
  }
}%%
sequenceDiagram
    participant User
    participant App
    User->>App: Login
    activate App
    App-->>User: Success
    deactivate App
```
