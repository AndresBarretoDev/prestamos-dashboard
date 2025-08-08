# 📋 **PRD: Implementación de Autenticación con Supabase UI**

## 📝 **1. INFORMACIÓN DEL PROYECTO**

- **Producto**: Sistema de Gestión de Préstamos
- **Funcionalidad**: Autenticación y Autorización de Usuarios
- **Versión**: 3.0
- **Fecha**: Enero 2024
- **Autor**: Desarrollo
- **Estado**: En Desarrollo

## 🎯 **2. OBJETIVOS**

### **Objetivo Principal**
Implementar un sistema de autenticación robusto que permita a diferentes tipos de usuarios acceder al sistema con permisos específicos, utilizando componentes nativos de Supabase UI.

### **Alcance**
- ✅ Registro e inicio de sesión de usuarios
- ✅ Gestión de sesiones y estados de usuario
- ✅ Integración con el sistema existente
- ✅ Soporte para roles (admin vs usuario normal)
- ✅ Uso prioritario de componentes Supabase UI y shadcn/ui
- ✅ Vistas condicionales según rol de usuario
- ❌ No modificar la lógica de negocio existente
- ❌ No cambiar la estructura de base de datos (fase 2)

## 👥 **2.1 SISTEMA DE ROLES Y PERMISOS**

### **Roles Definidos:**

#### **🔴 Admin (Super Administrador)**
- **Identificación**: Email configurado en `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`
- **Acceso**: Completo a todas las funcionalidades del sistema
- **Permisos**:
  - ✅ Crear, editar, eliminar préstamos
  - ✅ Ver todos los préstamos del sistema
  - ✅ Acceso completo a dashboard y reportes
  - ✅ Gestión de usuarios (futuro)
  - ✅ Configuración del sistema
- **Implementación**: Verificación por email en AuthGuard

#### **🟡 Usuario Autenticado (Deudor)**
- **Identificación**: Usuario registrado en Supabase Auth
- **Acceso**: Limitado a ver solo sus propios préstamos
- **Permisos**:
  - ✅ Ver sus propios préstamos (Fase 7)
  - ✅ Ver detalles de sus cuotas (Fase 7)
  - ✅ Acceso directo a su préstamo sin pasar por dashboard (Fase 7)
  - ❌ No puede crear/editar préstamos
  - ❌ No puede ver préstamos de otros usuarios
- **Implementación**: Filtrado por `user_id` en consultas (Fase 7)

#### **⚪ Usuario No Autenticado (Flujo de Autenticación)**
- **Identificación**: No autenticado (no existe en BD)
- **Acceso**: Solo páginas de autenticación
- **Permisos**:
  - ✅ Registrarse en el sistema
  - ✅ Iniciar sesión
  - ✅ Recuperar contraseña
  - ❌ No puede acceder a funcionalidades del sistema
- **Implementación**: Redirección a login para rutas protegidas

### **Estructura de Permisos por Fase:**

#### **Fase 1-6 (Actual)**
- Solo Admin puede acceder al sistema
- Usuarios normales redirigidos a login
- Protección básica implementada

#### **Fase 7 (Futuro)**
- Implementar RLS (Row Level Security) en Supabase
- Agregar columna `user_id` a tablas `deudores`
- Filtrar consultas por usuario autenticado
- Vistas condicionales según rol
- Redirección inteligente post-login

---

## 💻 **3. ESPECIFICACIONES TÉCNICAS**

### **3.1 Configuración de Supabase**
```typescript
// lib/supabase.ts (ya existe)
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### **3.2 Variables de Entorno Requeridas**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=tu_correo_admin@dominio.com
```

### **3.3 Componentes de Supabase UI (Instalados Automáticamente)**
```
components/ui/
├── auth-form.tsx              # Formulario de autenticación completo
├── login-form.tsx             # Formulario de login
├── register-form.tsx          # Formulario de registro
├── reset-password-form.tsx    # Formulario de reset de contraseña
├── update-password-form.tsx   # Formulario de actualización de contraseña
└── [otros componentes shadcn/ui]
```

### **3.4 Páginas de Supabase UI (Creadas Automáticamente)**
```
app/
├── login/
│   └── page.tsx               # Página de login (ya creada)
├── register/
│   └── page.tsx               # Página de registro (ya creada)
├── auth/
│   ├── confirm/
│   │   └── page.tsx           # Confirmación de email (ya creada)
│   ├── reset-password/
│   │   └── page.tsx           # Reset de contraseña (ya creada)
│   └── update-password/
│       └── page.tsx           # Actualizar contraseña (ya creada)
└── page.tsx                   # Dashboard protegido
```

### **3.5 Componentes Personalizados a Crear**
```
components/
├── auth/
│   ├── auth-guard.tsx         # Protección de rutas (CREAR)
│   └── session-manager.tsx    # Gestión de sesión (CREAR)
├── navbar.tsx                 # Navegación actualizada (MODIFICAR)
└── [componentes existentes]
```

---

## 📋 **4. PLAN DE IMPLEMENTACIÓN**

### **FASE 1: Configuración Inicial**

#### **TAREA 1.1: Verificar Configuración de Supabase**
- **Estado**: ✅ Completada
- **Descripción**: Confirmar que Supabase está correctamente configurado
- **Pasos**:
  1. Verificar que `lib/supabase.ts` existe y funciona
  2. Confirmar que las variables de entorno están configuradas
  3. Probar conexión con Supabase
- **Criterios de Aceptación**:
  - [x] Cliente de Supabase se inicializa sin errores
  - [x] Variables de entorno están definidas
  - [x] Conexión a Supabase funciona correctamente
- **Archivos a verificar**: `lib/supabase.ts`, `.env.local`
- **Comando de prueba**: `npm run dev` (sin errores de Supabase)

#### **TAREA 1.2: Instalar Supabase UI**
- **Estado**: ✅ Completada
- **Descripción**: Instalar el bloque de autenticación de Supabase UI
- **Pasos**:
  1. Ejecutar comando de instalación de Supabase UI
  2. Verificar que los componentes se instalan correctamente
  3. Revisar archivos generados
  4. **IMPORTANTE**: Usar componentes nativos de Supabase UI
- **Criterios de Aceptación**:
  - [x] Comando se ejecuta sin errores
  - [x] Componentes de auth se instalan en `components/`
  - [x] Páginas de auth se crean en `app/auth/`
  - [x] Componentes nativos funcionan correctamente
- **Comando**: `npx shadcn@latest add https://supabase.com/ui/r/password-based-auth-nextjs.json`
- **Nota**: Los componentes instalados cubren RF-001, RF-002, RF-003 automáticamente

#### **TAREA 1.3: Configurar Variables de Entorno**
- **Estado**: ✅ Completada
- **Descripción**: Asegurar que todas las variables necesarias estén configuradas
- **Pasos**:
  1. Verificar `NEXT_PUBLIC_SUPABASE_URL`
  2. Verificar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  3. Agregar `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`
- **Criterios de Aceptación**:
  - [x] Todas las variables están definidas en `.env.local`
  - [x] No hay errores de variables no definidas
  - [x] El email de admin está configurado correctamente

### **FASE 2: Implementación de Componentes de Autenticación**

#### **TAREA 2.1: Crear AuthGuard Component**
- **Estado**: ✅ Completada
- **Descripción**: Componente para proteger rutas que requieren autenticación
- **Pasos**:
  1. Crear `components/auth/auth-guard.tsx`
  2. Implementar lógica de verificación de sesión
  3. Agregar soporte para roles (admin vs usuario)
  4. **IMPORTANTE**: Usar hooks de Supabase UI cuando sea posible
- **Criterios de Aceptación**:
  - [x] Componente se renderiza correctamente
  - [x] Redirige a login si no hay sesión
  - [x] Verifica rol de admin correctamente
  - [x] No causa errores de hidratación
- **Archivo**: `components/auth/auth-guard.tsx`
- **Nota**: Este componente cubre RF-004 y RF-006

#### **TAREA 2.2: Crear Hook de Sesión**
- **Estado**: ✅ Completada
- **Descripción**: Hook personalizado para manejar el estado de la sesión
- **Pasos**:
  1. Crear `hooks/use-session.tsx`
  2. Implementar lógica de suscripción a cambios de auth
  3. Proporcionar estado de loading y error
  4. **IMPORTANTE**: Usar hooks nativos de Supabase UI
- **Criterios de Aceptación**:
  - [x] Hook retorna sesión actual
  - [x] Se actualiza automáticamente con cambios de auth
  - [x] Maneja estados de loading correctamente
  - [x] No causa memory leaks
- **Archivo**: `hooks/use-session.tsx`
- **Nota**: Usar hooks de Supabase UI como `useAuth` si están disponibles

#### **TAREA 2.3: Actualizar Navbar con Autenticación**
- **Estado**: ✅ Completada
- **Descripción**: Integrar controles de login/logout en la navegación existente
- **Pasos**:
  1. Modificar `components/navbar.tsx`
  2. Agregar lógica de sesión usando hooks de Supabase UI
  3. Mostrar botón de login o logout según estado
  4. Agregar información del usuario
- **Criterios de Aceptación**:
  - [x] Muestra "Iniciar sesión" cuando no hay sesión
  - [x] Muestra email del usuario cuando hay sesión
  - [x] Botón de logout funciona correctamente
  - [x] No rompe el diseño existente
- **Archivo**: `components/navbar.tsx`
- **Nota**: Este componente cubre RF-005

### **FASE 3: Verificación de Páginas de Autenticación**

#### **TAREA 3.1: Verificar Página de Login**
- **Estado**: ✅ Completada
- **Descripción**: Verificar que la página de login funciona correctamente
- **Pasos**:
  1. Verificar que `app/auth/login/page.tsx` existe (creada por Supabase UI)
  2. Probar funcionalidad de login
  3. Verificar redirección post-login
  4. **IMPORTANTE**: No modificar componentes nativos de Supabase UI
- **Criterios de Aceptación**:
  - [x] Página se renderiza correctamente
  - [x] Login funciona con credenciales válidas
  - [x] Maneja errores apropiadamente
  - [x] Redirige al dashboard después del login
- **Archivo**: `app/auth/login/page.tsx` (ya creado por Supabase UI)
- **Nota**: Este componente cubre RF-002 automáticamente

#### **TAREA 3.2: Verificar Página de Registro**
- **Estado**: ✅ Completada
- **Descripción**: Verificar que la página de registro funciona correctamente
- **Pasos**:
  1. Verificar que `app/auth/sign-up/page.tsx` existe (creada por Supabase UI)
  2. Probar funcionalidad de registro
  3. Verificar envío de email de confirmación
  4. **IMPORTANTE**: No modificar componentes nativos de Supabase UI
- **Criterios de Aceptación**:
  - [x] Página se renderiza correctamente
  - [x] Registro funciona con datos válidos
  - [x] Maneja errores apropiadamente
  - [x] Envía email de confirmación
- **Archivo**: `app/auth/sign-up/page.tsx` (ya creado por Supabase UI)
- **Nota**: Este componente cubre RF-001 automáticamente

#### **TAREA 3.3: Verificar Páginas de Confirmación y Reset**
- **Estado**: ✅ Completada
- **Descripción**: Verificar que las páginas de confirmación y reset funcionan
- **Pasos**:
  1. Verificar `app/auth/confirm/route.ts` (creada por Supabase UI)
  2. Verificar `app/auth/forgot-password/page.tsx` (creada por Supabase UI)
  3. Probar flujos de confirmación y reset
  4. **IMPORTANTE**: No modificar componentes nativos de Supabase UI
- **Criterios de Aceptación**:
  - [x] Confirmación de email funciona
  - [x] Reset de contraseña funciona
  - [x] Páginas manejan errores correctamente
  - [x] Redirecciones funcionan apropiadamente
- **Nota**: Estos componentes cubren RF-003 automáticamente

### **FASE 4: Protección de Rutas**

#### **TAREA 4.1: Proteger Dashboard Principal**
- **Estado**: ✅ Completada
- **Descripción**: Aplicar AuthGuard al dashboard principal
- **Pasos**:
  1. Modificar `app/page.tsx`
  2. Envolver contenido con AuthGuard
  3. Configurar para requerir admin
- **Criterios de Aceptación**:
  - [x] Usuarios no autenticados son redirigidos a login
  - [x] Usuarios no admin son redirigidos a login
  - [x] Admin puede acceder normalmente
  - [x] No causa errores de renderizado
- **Archivo**: `app/page.tsx`

#### **TAREA 4.2: Proteger Páginas de Préstamos**
- **Estado**: ✅ Completada
- **Descripción**: Aplicar AuthGuard a las páginas de detalle de préstamos
- **Pasos**:
  1. Modificar `app/prestamos/[id]/page.tsx`
  2. Envolver contenido con AuthGuard
  3. Configurar para requerir admin
- **Criterios de Aceptación**:
  - [x] Usuarios no autenticados son redirigidos a login
  - [x] Usuarios no admin son redirigidos a login
  - [x] Admin puede acceder normalmente
  - [x] No causa errores de renderizado
- **Archivo**: `app/prestamos/[id]/page.tsx`

#### **TAREA 4.3: Verificar Middleware**
- **Estado**: ✅ Completada
- **Descripción**: Verificar que el middleware funciona correctamente
- **Pasos**:
  1. Verificar que `middleware.ts` está configurado
  2. Probar redirecciones automáticas
  3. Verificar protección de rutas
- **Criterios de Aceptación**:
  - [x] Middleware está configurado correctamente
  - [x] Redirecciones automáticas funcionan
  - [x] Protección de rutas funciona
  - [x] No hay errores en consola
- **Archivo**: `middleware.ts`

### **FASE 5: Pruebas y Verificación**

#### **TAREA 5.1: Pruebas de Flujo de Autenticación**
- **Estado**: ✅ Completada
- **Descripción**: Probar el flujo completo de autenticación
- **Pasos**:
  1. Probar registro de usuario
  2. Probar confirmación de email
  3. Probar login de usuario
  4. Probar logout
  5. Probar recuperación de contraseña
- **Criterios de Aceptación**:
  - [x] Registro funciona correctamente
  - [x] Confirmación de email funciona
  - [x] Login funciona correctamente
  - [x] Logout funciona correctamente
  - [x] Recuperación de contraseña funciona

#### **TAREA 5.2: Pruebas de Protección de Rutas**
- **Estado**: ✅ Completada
- **Descripción**: Verificar que las rutas están protegidas correctamente
- **Pasos**:
  1. Probar acceso sin autenticación
  2. Probar acceso con usuario no admin
  3. Probar acceso con admin
  4. Probar redirecciones
- **Criterios de Aceptación**:
  - [x] Rutas protegidas redirigen a login
  - [x] Usuarios no admin no pueden acceder
  - [x] Admin puede acceder a todas las rutas
  - [x] Redirecciones funcionan correctamente

#### **TAREA 5.3: Pruebas de UI/UX**
- **Estado**: ✅ Completada
- **Descripción**: Verificar que la interfaz funciona correctamente
- **Pasos**:
  1. Probar navegación en diferentes estados
  2. Verificar que los componentes se renderizan correctamente
  3. Probar responsive design
  4. Verificar accesibilidad básica
- **Criterios de Aceptación**:
  - [x] Navbar funciona en todos los estados
  - [x] Formularios son responsivos
  - [x] Mensajes de error son claros
  - [x] Loading states funcionan correctamente

### **FASE 6: Documentación y Limpieza**

#### **TAREA 6.1: Documentar Implementación**
- **Estado**: ✅ Completada
- **Descripción**: Crear documentación de la implementación
- **Pasos**:
  1. Documentar componentes creados
  2. Documentar flujos de autenticación
  3. Documentar configuración necesaria
  4. Crear guía de uso
- **Criterios de Aceptación**:
  - [x] Documentación está completa
  - [x] Guía de uso es clara
  - [x] Configuración está documentada
  - [x] Troubleshooting está incluido

#### **TAREA 6.2: Limpieza y Optimización**
- **Estado**: ✅ Completada
- **Descripción**: Limpiar código y optimizar implementación
- **Pasos**:
  1. Revisar y limpiar código no utilizado
  2. Optimizar imports
  3. Verificar que no hay warnings
  4. Optimizar bundle size si es necesario
- **Criterios de Aceptación**:
  - [x] No hay código no utilizado
  - [x] No hay warnings en consola
  - [x] Imports están optimizados
  - [x] Bundle size es razonable

### **FASE 7: Implementación de Roles y Vistas Condicionales**

#### **TAREA 7.1: Configurar Base de Datos para Roles**
- **Estado**: ✅ Completada
- **Descripción**: Agregar soporte para asociar préstamos a usuarios
- **Pasos**:
  1. Agregar campo `user_id` a tabla `deudores`
  2. Configurar RLS (Row Level Security) en Supabase
  3. Asociar préstamos existentes al admin
  4. Configurar políticas de acceso
- **Criterios de Aceptación**:
  - [x] Campo `user_id` existe en tabla `deudores`
  - [x] RLS está configurado correctamente
  - [x] Admin puede ver todos los préstamos
  - [x] Clientes solo ven sus propios préstamos
- **Archivo**: Base de datos (usar MCP)
- **Nota**: Usar MCP para configurar Supabase

#### **TAREA 7.2: Implementar Redirección Condicional Post-Login**
- **Estado**: ✅ Completada
- **Descripción**: Redirigir usuarios según su rol después del login
- **Pasos**:
  1. Modificar `components/login-form.tsx`
  2. Implementar lógica de redirección según email
  3. Admin → `/` (dashboard)
  4. Cliente → `/prestamos/[id]` (su préstamo)
- **Criterios de Aceptación**:
  - [x] Admin va al dashboard después del login
  - [x] Cliente va directo a su préstamo después del login
  - [x] Redirección funciona correctamente
  - [x] No hay errores en la consola
- **Archivo**: `components/login-form.tsx`
- **Nota**: Modificar componente nativo de Supabase UI

#### **TAREA 7.3: Implementar Vista Condicional en Prestamo Detail**
- **Estado**: ✅ Completada
- **Descripción**: Mostrar/ocultar elementos según rol del usuario
- **Pasos**:
  1. Modificar `app/prestamos/[id]/prestamo-detail.tsx`
  2. Agregar lógica de verificación de rol
  3. Ocultar elementos sensibles para clientes:
     - Mensaje de ganancia total
     - Botones de acción (abonar, editar, etc.)
     - Tabla de abonos completa
     - Información sensible del prestamista
  4. Mantener información básica visible para clientes
- **Criterios de Aceptación**:
  - [x] Admin ve todos los elementos
  - [x] Cliente ve solo información básica
  - [x] Elementos sensibles están ocultos para clientes
  - [x] Diseño se mantiene consistente
- **Archivo**: `app/prestamos/[id]/prestamo-detail.tsx`
- **Nota**: Modificar componente existente

#### **TAREA 7.4: Configurar Protección de Rutas por Rol**
- **Estado**: ✅ Completada
- **Descripción**: Proteger rutas según el rol del usuario
- **Pasos**:
  1. Modificar AuthGuard para diferentes tipos de protección
  2. Proteger `/prestamos/[id]` para que cliente solo vea su préstamo
  3. Mantener `/` protegido solo para admin
  4. Implementar verificación de propiedad de préstamo
- **Criterios de Aceptación**:
  - [x] Cliente solo puede acceder a su propio préstamo
  - [x] Admin puede acceder a todos los préstamos
  - [x] Intentos de acceso no autorizado son bloqueados
  - [x] Redirecciones funcionan correctamente
- **Archivo**: `components/auth/auth-guard.tsx`
- **Nota**: Mejorar componente existente

#### **TAREA 7.5: Pruebas de Flujo Completo**
- **Estado**: ✅ Completada
- **Descripción**: Probar el flujo completo de roles
- **Pasos**:
  1. Probar registro de cliente
  2. Probar login de cliente → redirección a su préstamo
  3. Probar login de admin → redirección a dashboard
  4. Probar acceso no autorizado a préstamos
  5. Probar vista condicional en prestamo-detail
- **Criterios de Aceptación**:
  - [x] Flujo de cliente funciona correctamente
  - [x] Flujo de admin funciona correctamente
  - [x] Protección de rutas funciona
  - [x] Vistas condicionales funcionan
  - [x] No hay errores en consola

---

## 🚀 **5. CRITERIOS DE ÉXITO**

### **Funcionalidad**
- ✅ Usuarios pueden registrarse e iniciar sesión
- ✅ Rutas están protegidas apropiadamente
- ✅ Navegación funciona correctamente
- ✅ Manejo de errores es robusto

### **Seguridad**
- ✅ Credenciales se validan correctamente
- ✅ Sesiones se manejan de forma segura
- ✅ Roles se verifican apropiadamente
- ✅ No hay vulnerabilidades obvias

### **Experiencia de Usuario**
- ✅ Interfaz es intuitiva y responsiva
- ✅ Mensajes de error son claros
- ✅ Loading states son apropiados
- ✅ Flujos son fluidos

### **Técnico**
- ✅ Código está bien estructurado
- ✅ Componentes son reutilizables
- ✅ Performance es aceptable
- ✅ No hay memory leaks

---

## 📝 **6. NOTAS DE IMPLEMENTACIÓN**

### **Consideraciones Importantes**
- **PRIORIDAD**: Usar componentes nativos de Supabase UI siempre que sea posible
- Cada tarea debe completarse y verificarse antes de continuar
- Mantener consistencia con el diseño existente
- Probar en diferentes navegadores y dispositivos
- **NO MODIFICAR** componentes nativos de Supabase UI

### **Componentes de Supabase UI (Usar Nativos)**
- ✅ `auth-form.tsx` - Formulario completo de autenticación
- ✅ `login-form.tsx` - Formulario de login
- ✅ `register-form.tsx` - Formulario de registro
- ✅ `reset-password-form.tsx` - Formulario de reset
- ✅ `update-password-form.tsx` - Formulario de actualización

### **Componentes Personalizados (Crear)**
- ✅ `auth-guard.tsx` - Protección de rutas
- ✅ `use-session.tsx` - Gestión de sesión
- ✅ `navbar.tsx` - Navegación actualizada

### **Consideraciones para FASE 7**
- **SIMPLE**: Mantener cambios mínimos en componentes existentes
- **SEGURIDAD**: Cliente solo ve su propio préstamo
- **UX**: Cliente va directo a su préstamo sin pasar por dashboard
- **MANTENIMIENTO**: Usar lógica condicional en lugar de componentes duplicados

---

## 📊 **7. ESTADO ACTUAL DEL PROYECTO**

### **✅ FASES COMPLETADAS:**
- **FASE 1**: Configuración inicial (3/3 tareas)
- **FASE 2**: Implementación de componentes (3/3 tareas)
- **FASE 3**: Verificación de páginas (3/3 tareas)
- **FASE 4**: Protección de rutas (3/3 tareas)
- **FASE 5**: Pruebas y verificación (3/3 tareas)
- **FASE 6**: Documentación y limpieza (2/2 tareas)
- **FASE 7**: Roles y vistas condicionales (5/5 tareas)

### **📈 PROGRESO TOTAL:**
- **Completadas**: 23/23 tareas (100%)
- **Pendientes**: 0/23 tareas (0%)

---

## 🎯 **8. PRÓXIMOS PASOS RECOMENDADOS**

### **Opción A: Continuar con FASE 5 (Recomendado)**
1. Completar pruebas de autenticación
2. Verificar protección de rutas
3. Probar UI/UX
4. **Beneficio**: Asegurar que la base está sólida antes de agregar funcionalidades

### **Opción B: Saltar a FASE 7**
1. Configurar base de datos con MCP
2. Implementar roles y vistas condicionales
3. **Beneficio**: Implementar funcionalidad completa de roles

### **Opción C: Híbrido**
1. Completar TAREA 5.1 (pruebas básicas)
2. Saltar a FASE 7 (roles)
3. Completar FASE 5 después
4. **Beneficio**: Balance entre estabilidad y funcionalidad

**¿Qué opción prefieres?**
