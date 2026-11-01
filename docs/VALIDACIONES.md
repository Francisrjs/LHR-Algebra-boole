# Validaciones y límites actuales

## Capas

1. Frontend: tipos TypeScript, controles y validateProject antes de importar.
2. API: Pydantic valida tipos, enumeraciones, números finitos y estructura anidada.
3. Núcleo: parser seguro y condiciones matemáticas.
4. Presentación: último resultado válido, mensajes y discontinuidades sin conectar valores indefinidos.

El backend es la validación definitiva; los controles visuales no sustituyen sus reglas.

## Parser y modelo

- Operadores admitidos: +,-,*,/,potencias enteras de valor absoluto hasta32; paréntesis y multiplicación implícita como (s+1)(s+2).
- Variable s, parámetros nombrados, decimales con punto, notación científica y coeficientes descendentes [1,3,2]. Se reconocen s²,s³, menos Unicode y punto de multiplicación.
- No ejecuta eval. Recorre un AST restringido y rechaza llamadas, atributos y sintaxis ajena a expresiones racionales.
- Máximo de expresión procesada:2000 caracteres; profundidad AST40; orden polinómico de seguridad64. No es un límite de rendimiento garantizado: orden6 es el caso medido.
- Denominador no nulo, coeficientes finitos y parámetros conocidos. K está reservado al control externo.
- No se cancelan polos/ceros automáticamente. Una cancelación visible no garantiza estabilidad interna.

## Contratos

- K finito y no negativo.
- Frecuencia: mínimo positivo, máximo mayor; relación máximo/mínimo hasta1e16 en núcleo.
- Duración temporal finita, positiva y hasta10000 segundos; amplitud finita.
- Álgebra:2–32 operandos y operación reconocida.
- Raíces: coordenadas finitas e índice existente. Se conserva conjugación y ganancia líder; una raíz real no adquiere imaginaria mediante arrastre.
- Parámetro de proyecto: nombre alfanumérico comenzando en letra, distinto de s/K; nombres únicos; paso>0; máximo>mínimo y valor dentro del rango.
- Rangos gráficos: extremos finitos y crecientes; solo ejes admitidos. Proyecto versión1 y formato controllab.

## Casos matemáticos

La estabilidad usa tolerancias numéricas, no aritmética simbólica exacta. Se distinguen polos con parte real positiva, polos simples sobre el eje y repetidos sobre el eje. Un sistema característico singular puede tener estado undefined.

Con K0 no se asigna una fase al lazo nulo. Las singularidades sobre jω interrumpen la curva. Las aproximaciones de fase con factores imaginarios puros no se ofrecen. Los márgenes no determinan por sí solos la estabilidad global y no se limitan al zoom visible.

Una transferencia impropia conserva análisis de frecuencia pero informa incompatibilidad temporal/LGR según el módulo. Los errores numéricos de márgenes, LGR o temporal se aíslan cuando es posible y aparecen como error/avisos en una respuesta200.

La simulación temporal usa al menos1001 muestras y adapta la densidad a oscilación/decaimiento de polos (32 puntos/ciclo y16 por escala de decaimiento). Si necesita más de50000 muestras, solicita reducir duración; valores no finitos por divergencia también se informan. Esta estrategia no equivale a una certificación universal para todo modelo mal condicionado.

## Persistencia y seguridad local

Abrir valida el JSON antes de reemplazar el proyecto. Un archivo inválido no debe destruir el estado de trabajo. El servidor no guarda proyectos ni proporciona acceso genérico al sistema de archivos. La API no tiene autenticación: está diseñada para loopback y no para publicarse en una red.
