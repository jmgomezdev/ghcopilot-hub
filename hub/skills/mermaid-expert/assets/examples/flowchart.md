# Mermaid Flowchart Expert Guide

Flowcharts are composed of nodes (geometric shapes) and edges (arrows or lines). The Mermaid code defines how nodes are created and creating links between the nodes.

## 1. Directions
- `TB` - Top to bottom
- `TD` - Top-down/ same as top to bottom
- `BT` - Bottom to top
- `RL` - Right to left
- `LR` - Left to right

## 2. Shapes (Nodes)

### Standard Shapes
```mermaid
flowchart TD
    id1(Round Edges)
    id2([Stadium])
    id3[[Subroutine]]
    id4[(Database)]
    id5((Circle))
    id6>Asymmetric]
    id7{Rhombus}
    id8{{Hexagon}}
```

### New / Semantic Shapes
```mermaid
flowchart LR
    A[/Parallelogram/]
    B[\Parallelogram Alt\]
    C[/Trapezoid\]
    D[\Trapezoid Alt/]
    E(((Double Circle)))
```

## 3. Links (Edges)

### Types of Links
```mermaid
flowchart LR
    A-->B     ::: Link with Arrow Head
    C---D     ::: Open Link
    E--Text-->F ::: Link with Text
    G---|Text|---H ::: Open Link with Text
    I-.->J    ::: Dotted Link
    K==>L     ::: Thick Link
```

### Chaining
```mermaid
flowchart LR
   A -- text --> B -- text2 --> C
   a --> b & c--> d
```

## 4. Subgraphs
Group related nodes together.

```mermaid
flowchart TB
    c1-->a2
    subgraph one
    a1-->a2
    end
    subgraph two
    b1-->b2
    end
    subgraph three
    c1-->c2
    end
```

## 5. EXPERT: Styling & Classes

### Inline Styling
```mermaid
flowchart LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
```

### CSS Classes
Define a class and apply it to multiple nodes.

```mermaid
flowchart LR
    A:::someclass --> B:::someclass
    classDef someclass fill:#f96,stroke:#333,stroke-width:4px;
```

### FontAwesome Icons
(Requires FontAwesome to be loaded in the renderer)
```mermaid
flowchart TD
    B["fa:fa-twitter for peace"]
    B-->C[fa:fa-ban forbidden]
    C-->D(fa:fa-spinner);
    D-->E(A fa:fa-camera-retro perhaps?);
```

## 6. Configuration (Directives)
Customize the curve and look directly in the diagram.

```mermaid
%%{init: { 'theme': 'base', 'flowchart': { 'curve': 'step' } } }%%
graph LR
    A[Start] --> B{Decision}
    B -- Yes --> C[Do It]
    B -- No --> D[Don't]
```
