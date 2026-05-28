# Casos de uso de importación de contactos

Este diagrama modela el comportamiento de ingesta de contactos para los formatos admitidos y las reglas obligatorias de normalización, deduplicación y reporte de registros inválidos.

```mermaid
flowchart LR
  Owner[Propietario]
  Editor[Editor]
  Viewer[Visualizador]

  subgraph SendIOImport[Módulo de importación de contactos de SendIO]
    UC1([Cargar archivo o lista de importación])
    UC2([Analizar CSV, JSON o lista separada por punto y coma])
    UC3([Normalizar campos del contacto])
    UC4([Deduplicación sin distinción de mayúsculas y minúsculas])
    UC5([Omitir registros inválidos])
    UC6([Generar informe de importación])
  end

  Owner --> UC1
  Editor --> UC1
  UC1 --> UC2
  UC2 --> UC3
  UC3 --> UC4
  UC4 --> UC5
  UC5 --> UC6
  Viewer -. sin permisos .-> UC1
```

- Las formas de entrada admitidas son CSV, JSON y cargas de listas delimitadas por punto y coma.
- La normalización se aplica antes de la deduplicación para reducir discrepancias de forma canónica.
- La deduplicación no distingue mayúsculas y minúsculas y preserva una única identidad canónica del contacto.
- Las filas inválidas se omiten y se exponen en un informe explícito de importación.
