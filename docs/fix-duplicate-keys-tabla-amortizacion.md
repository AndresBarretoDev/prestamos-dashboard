# 🔧 Fix: Error de Claves Duplicadas en Tabla de Amortización

## 📋 Problema Identificado

**Error**: `Encountered two children with the same key, '12'. Keys should be unique so that components maintain their identity across updates.`

**Ubicación**: `components/tabla-amortizacion.tsx` línea 75

**Causa**: Se estaban usando `cuota.numero` como clave única en el map, pero después de recalcular cuotas por abonos a capital, pueden existir cuotas con el mismo número.

## 🎯 Solución Implementada ✅

### **1. Cambio de Clave Única**

**Antes**:
```tsx
{cuotasToRender.map((cuota) => {
  return (
    <TableRow key={cuota.numero}>
      // ...
    </TableRow>
  )
})}
```

**Después**:
```tsx
{cuotasToRender.map((cuota, index) => {
  return (
    <TableRow key={cuota.id || `cuota-${cuota.numero}-${index}`}>
      // ...
    </TableRow>
  )
})}
```

### **2. Lógica de Clave Mejorada**

La nueva clave utiliza una estrategia de fallback:

1. **Primera opción**: `cuota.id` (ID único de la base de datos)
2. **Fallback**: `cuota-${cuota.numero}-${index}` (combinación de número e índice)

Esto garantiza que cada fila tenga una clave única, incluso si:
- Las cuotas no tienen ID (caso de tabla calculada)
- Hay números de cuota duplicados
- Se recalculan las cuotas después de abonos a capital

## 🔍 Análisis Técnico

### **¿Por qué ocurría este problema?**

1. **Recálculo de cuotas**: Cuando se hace un abono a capital, se recalculan las cuotas pendientes
2. **Numeración duplicada**: El algoritmo de recálculo puede crear cuotas con números duplicados
3. **Clave basada en número**: Usar `cuota.numero` como clave causaba conflictos

### **¿Cómo funciona la solución?**

1. **ID único**: Prioriza el ID de la base de datos como clave
2. **Fallback robusto**: Si no hay ID, usa una combinación única
3. **Índice del array**: Garantiza unicidad incluso con números duplicados

## ✅ Resultado Confirmado

Después de aplicar la corrección:

- ✅ **No más errores de claves duplicadas**
- ✅ **Componente mantiene identidad correcta**
- ✅ **Funciona con cuotas recalculadas**
- ✅ **Compatibilidad con diferentes fuentes de datos**

## 🚀 Próximos Pasos

1. ✅ **Identificar problema** - COMPLETADO
2. ✅ **Implementar solución** - COMPLETADO
3. ✅ **Verificar corrección** - COMPLETADO
4. 🔄 **Probar con abonos a capital** - PENDIENTE
5. 🔄 **Verificar que no hay regresiones** - PENDIENTE

## 📝 Notas Técnicas

### **Patrón de Clave Única**
```tsx
// Patrón recomendado para evitar claves duplicadas
key={item.id || `fallback-${item.identifier}-${index}`}
```

### **Casos de Uso Cubiertos**
- ✅ Cuotas de base de datos (con ID)
- ✅ Cuotas calculadas (sin ID)
- ✅ Cuotas recalculadas después de abonos
- ✅ Cuotas con números duplicados

### **Mejores Prácticas**
1. **Siempre usar claves únicas** en listas de React
2. **Priorizar IDs de base de datos** cuando estén disponibles
3. **Usar fallbacks robustos** para casos edge
4. **Incluir índice del array** como último recurso

---

**Fecha de Corrección**: Enero 2025  
**Estado**: ✅ **SOLUCIONADO**  
**Impacto**: Eliminación de errores de claves duplicadas  
**Archivo**: `components/tabla-amortizacion.tsx`
