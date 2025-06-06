# 📋 **PRD: Sistema de Recordatorios con Integración n8n**

## **Información del Documento**
- **Producto**: Sistema de Gestión de Préstamos
- **Funcionalidad**: Recordatorios Automáticos vía WhatsApp
- **Versión**: 1.0
- **Fecha**: Enero 2024
- **Autor**: Desarrollo

---

## 🎯 **1. OBJETIVO Y ALCANCE**

### **Objetivo Principal:**
Integrar el sistema actual de préstamos con n8n para envío automático de recordatorios de pago vía WhatsApp, utilizando la UI existente sin modificaciones.

### **Alcance:**
- ✅ Mantener UI actual del `NotificacionDialog`
- ✅ Conectar dashboard con n8n mediante webhooks
- ✅ Enviar datos completos de préstamos y cuotas
- ✅ Gestionar activación/desactivación de recordatorios
- ✅ Soporte para múltiples préstamos simultáneos
- ❌ No modificar Evolution API o n8n (ya existentes)
- ❌ No cambiar interfaz de usuario

---

## 🔧 **2. REQUISITOS FUNCIONALES**

### **RF-001: Activación de Recordatorios**
- **Descripción**: Usuario puede activar recordatorios desde el modal existente
- **Comportamiento**: Al guardar configuración, enviar datos a n8n
- **Datos enviados**: Configuración completa + cuotas pendientes

### **RF-002: Desactivación de Recordatorios**
- **Descripción**: Usuario puede desactivar recordatorios
- **Comportamiento**: Enviar señal de desactivación a n8n
- **Resultado**: n8n cancela recordatorios programados para ese préstamo

### **RF-003: Actualización Automática**
- **Descripción**: Cambios en cuotas se reflejan en n8n
- **Trigger**: Cuando se marca cuota como pagada
- **Acción**: Reenviar datos actualizados a n8n

### **RF-004: Gestión Multi-préstamo**
- **Descripción**: Cada préstamo tiene configuración independiente
- **Comportamiento**: n8n recibe datos por `prestamo_id`
- **Requisito**: No interferencia entre préstamos

---

## 💻 **3. ESPECIFICACIONES TÉCNICAS**

### **3.1 Nuevo Servicio de Notificaciones**
```typescript
// lib/services/notificaciones.ts
interface RecordatorioData {
  prestamo_id: string
  activo: boolean
  dias_anticipacion: number
  mensaje: string
  deudor: {
    nombre: string
    telefono: string
  }
  cuotas_pendientes: CuotaPendiente[]
}

export async function syncRecordatorioConN8N(data: RecordatorioData): Promise<boolean>
export async function notificarCuotaPagada(prestamo_id: string): Promise<boolean>
```

### **3.2 Integración en Componentes Existentes**
```typescript
// components/notificacion-dialog.tsx
const handleGuardar = async () => {
  // 1. Guardar en Supabase (existente)
  // 2. NUEVO: Sincronizar con n8n
  // 3. Mostrar resultado al usuario
}
```

### **3.3 API Endpoint de n8n**
- **URL**: `https://[n8n-instance]/webhook/recordatorios`
- **Método**: POST
- **Content-Type**: application/json
- **Autenticación**: API Key (opcional)

### **3.4 Estructura de Datos**
```json
{
  "action": "update_recordatorio",
  "prestamo_id": "uuid",
  "activo": boolean,
  "config": {
    "dias_anticipacion": number,
    "mensaje": "string"
  },
  "deudor": {
    "nombre": "string",
    "telefono": "string"
  },
  "cuotas_pendientes": [
    {
      "numero": number,
      "fecha_vencimiento": "YYYY-MM-DD",
      "valor": number
    }
  ],
  "timestamp": "ISO-8601"
}
```

---

## 🔄 **4. FLUJOS DE USUARIO**

### **Flujo 1: Activar Recordatorios**
1. Usuario abre modal de recordatorios
2. Activa toggle "Activar recordatorio"
3. Personaliza mensaje (opcional)
4. Presiona "Guardar configuración"
5. **Sistema** guarda en Supabase
6. **Sistema** envía datos a n8n
7. **Sistema** muestra confirmación

### **Flujo 2: Desactivar Recordatorios**
1. Usuario abre modal de recordatorios
2. Desactiva toggle "Activar recordatorio"
3. Presiona "Guardar configuración"
4. **Sistema** actualiza Supabase
5. **Sistema** notifica desactivación a n8n
6. **Sistema** muestra confirmación

### **Flujo 3: Cuota Pagada (Automático)**
1. Usuario marca cuota como pagada
2. **Sistema** actualiza estado en BD
3. **Sistema** envía datos actualizados a n8n
4. **n8n** ajusta recordatorios programados

---

## ✅ **5. CRITERIOS DE ACEPTACIÓN**

### **CA-001: Integración Exitosa**
- ✅ Datos se envían correctamente a n8n
- ✅ n8n confirma recepción (status 200)
- ✅ Errores se manejan apropiadamente
- ✅ Usuario recibe feedback visual

### **CA-002: Datos Completos**
- ✅ Incluye todas las cuotas pendientes
- ✅ Fechas en formato correcto
- ✅ Información del deudor completa
- ✅ Configuración de recordatorio

### **CA-003: Manejo de Estados**
- ✅ Activación se refleja en n8n
- ✅ Desactivación cancela recordatorios
- ✅ Actualizaciones por cuotas pagadas
- ✅ Estados independientes por préstamo

### **CA-004: Experiencia de Usuario**
- ✅ UI actual no cambia
- ✅ Proceso de guardado fluido
- ✅ Mensajes de éxito/error claros
- ✅ Sin bloqueo de interfaz

---

## 🛠️ **6. IMPLEMENTACIÓN TÉCNICA**

### **6.1 Archivos a Crear:**
```
lib/services/notificaciones.ts     // Nuevo servicio
lib/config/n8n.ts                 // Configuración de n8n
types/notificaciones.ts            // Tipos TypeScript
```

### **6.2 Archivos a Modificar:**
```
components/notificacion-dialog.tsx // Agregar integración
app/prestamos/[id]/prestamo-detail.tsx // Sync en cuota pagada
```

### **6.3 Variables de Entorno:**
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/recordatorios
N8N_API_KEY=opcional-para-autenticacion
```

### **6.4 Manejo de Errores:**
- **Red no disponible**: Guardar localmente, reintentar después
- **n8n no responde**: Mostrar warning, permitir continuar
- **Datos inválidos**: Validar antes de enviar
- **Timeout**: Configurar 10s máximo

---

## 📊 **7. CONSIDERACIONES TÉCNICAS**

### **Rendimiento:**
- Requests asíncronos para no bloquear UI
- Timeout de 10 segundos máximo
- Retry automático 1 vez en caso de fallo

### **Seguridad:**
- Validar datos antes de enviar
- No exponer información sensible en logs
- Considerar API key para autenticación

### **Monitoreo:**
- Logs de requests exitosos/fallidos
- Métricas de tiempo de respuesta
- Alertas por fallos consecutivos

---

## 🚀 **8. PLAN DE IMPLEMENTACIÓN**

### **Fase 1: Setup Básico (2-3 horas)**
1. Crear servicio de notificaciones
2. Configurar variables de entorno
3. Implementar función de envío básica

### **Fase 2: Integración UI (1-2 horas)**
1. Modificar `notificacion-dialog.tsx`
2. Agregar manejo de errores
3. Implementar feedback visual

### **Fase 3: Sincronización Automática (1 hora)**
1. Integrar en flujo de cuota pagada
2. Enviar actualizaciones a n8n
3. Validar funcionamiento multi-préstamo

### **Fase 4: Testing y Refinamiento (1 hora)**
1. Pruebas con datos reales
2. Validar manejo de errores
3. Optimizar performance

**Tiempo Total Estimado: 5-7 horas**

---

## 📋 **9. TESTING**

### **Test Cases:**
- [ ] Activar recordatorio en préstamo nuevo
- [ ] Desactivar recordatorio existente  
- [ ] Marcar cuota como pagada (sync automático)
- [ ] Manejar error de conectividad con n8n
- [ ] Gestionar múltiples préstamos simultáneos
- [ ] Validar formato de datos enviados

### **Datos de Prueba:**
- Préstamo con 3 cuotas pendientes
- Números de teléfono válidos
- Mensajes con caracteres especiales
- Fechas en diferentes formatos

---

## 🎯 **10. MÉTRICAS DE ÉXITO**

- **Funcionalidad**: 100% de requests exitosos en condiciones normales
- **Performance**: < 2 segundos para sync con n8n
- **UX**: Sin cambios en flujo de usuario actual
- **Confiabilidad**: Manejo graceful de errores de red

---

## 📝 **11. NOTAS DE IMPLEMENTACIÓN**

### **Estado Actual:**
- Usuario ya tiene n8n y Evolution API configurados
- UI del `NotificacionDialog` está lista y no debe modificarse
- Sistema actual guarda datos en Supabase

### **Objetivo:**
- Conectar datos existentes con n8n
- Permitir control desde dashboard de activar/desactivar
- Enviar datos completos para múltiples préstamos
- Mantener sincronización automática

**¿Listo para implementar según este PRD?** 