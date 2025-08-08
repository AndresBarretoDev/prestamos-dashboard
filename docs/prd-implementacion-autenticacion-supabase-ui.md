# 🔐 **PRD: Implementación de Autenticación con Supabase UI**

## **Información del Documento**
- **Producto**: Sistema de Gestión de Préstamos
- **Funcionalidad**: Autenticación y Autorización de Usuarios
- **Versión**: 2.0
- **Fecha**: Enero 2024
- **Autor**: Desarrollo
- **Estado**: En Desarrollo

---

## 🎯 **1. OBJETIVO Y ALCANCE**

### **Objetivo Principal:**
Implementar un sistema completo de autenticación utilizando Supabase UI (basado en shadcn/ui) que permita a los usuarios registrarse, iniciar sesión y acceder a funcionalidades específicas según su rol.

### **Alcance:**
- ✅ Instalación y configuración de Supabase UI
- ✅ Páginas de login y registro con componentes shadcn/ui
- ✅ Protección de rutas y navegación condicional
- ✅ Gestión de sesiones y estados de usuario
- ✅ Integración con el sistema existente
- ✅ Soporte para roles (admin vs usuario normal)
- ✅ Uso prioritario de componentes Supabase UI y shadcn/ui
- ❌ No modificar la lógica de negocio existente
- ❌ No cambiar la estructura de base de datos (fase 2)

---

## 🔧 **2. REQUISITOS FUNCIONALES**

### **RF-001: Registro de Usuarios**
- **Descripción**: Los usuarios pueden crear cuentas nuevas
- **Comportamiento**: Formulario con validación y confirmación por email
- **Componentes**: Supabase UI RegisterForm (ya incluido)
- **Validación**: Email válido, contraseña segura
- **Nota**: Usar componente nativo de Supabase UI

### **RF-002: Inicio de Sesión**
- **Descripción**: Los usuarios pueden iniciar sesión con credenciales
- **Comportamiento**: Formulario con manejo de errores
- **Componentes**: Supabase UI LoginForm (ya incluido)
- **Seguridad**: Validación de credenciales
- **Nota**: Usar componente nativo de Supabase UI

### **RF-003: Recuperación de Contraseña**
- **Descripción**: Los usuarios pueden resetear su contraseña
- **Comportamiento**: Envío de email con link de reset
- **Componentes**: Supabase UI AuthForm (ya incluido)
- **Nota**: Usar componente nativo de Supabase UI

### **RF-004: Protección de Rutas**
- **Descripción**: Rutas sensibles solo accesibles para usuarios autenticados
- **Comportamiento**: Redirección a login si no autenticado
- **Implementación**: AuthGuard component + middleware
- **Nota**: Crear componente personalizado

### **RF-005: Navegación Condicional**
- **Descripción**: Navbar muestra opciones según estado de autenticación
- **Comportamiento**: Login/Logout según sesión activa
- **Componentes**: Integración con Navbar existente
- **Nota**: Modificar componente existente

### **RF-006: Gestión de Roles**
- **Descripción**: Diferentes niveles de acceso según rol
- **Comportamiento**: Admin acceso completo, usuarios limitados
- **Implementación**: Verificación por email en variables de entorno
- **Nota**: Crear componente personalizado

---

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
  - ✅ Ver sus propios préstamos (Fase 2)
  - ✅ Ver detalles de sus cuotas (Fase 2)
  - ✅ Acceso a dashboard personalizado (Fase 2)
  - ❌ No puede crear/editar préstamos
  - ❌ No puede ver préstamos de otros usuarios
- **Implementación**: Filtrado por `user_id` en consultas (Fase 2)

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

#### **Fase 1 (Actual)**
- Solo Admin puede acceder al sistema
- Usuarios normales redirigidos a login
- Protección básica implementada

#### **Fase 2 (Futuro)**
- Implementar RLS (Row Level Security) en Supabase
- Agregar columna `user_id` a tablas `deudores`
- Filtrar consultas por usuario autenticado
- Dashboard personalizado para cada usuario

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
- **Estado**: ⏳ Pendiente
- **Descripción**: Componente para proteger rutas que requieren autenticación
- **Pasos**:
  1. Crear `components/auth/auth-guard.tsx`
  2. Implementar lógica de verificación de sesión
  3. Agregar soporte para roles (admin vs usuario)
  4. **IMPORTANTE**: Usar hooks de Supabase UI cuando sea posible
- **Criterios de Aceptación**:
  - [ ] Componente se renderiza correctamente
  - [ ] Redirige a login si no hay sesión
  - [ ] Verifica rol de admin correctamente
  - [ ] No causa errores de hidratación
- **Archivo**: `components/auth/auth-guard.tsx`
- **Nota**: Este componente cubre RF-004 y RF-006

#### **TAREA 2.2: Crear Hook de Sesión**
- **Estado**: ⏳ Pendiente
- **Descripción**: Hook personalizado para manejar el estado de la sesión
- **Pasos**:
  1. Crear `hooks/use-session.ts`
  2. Implementar lógica de suscripción a cambios de auth
  3. Proporcionar estado de loading y error
  4. **IMPORTANTE**: Usar hooks nativos de Supabase UI
- **Criterios de Aceptación**:
  - [ ] Hook retorna sesión actual
  - [ ] Se actualiza automáticamente con cambios de auth
  - [ ] Maneja estados de loading correctamente
  - [ ] No causa memory leaks
- **Archivo**: `hooks/use-session.ts`
- **Nota**: Usar hooks de Supabase UI como `useAuth` si están disponibles

#### **TAREA 2.3: Actualizar Navbar con Autenticación**
- **Estado**: ⏳ Pendiente
- **Descripción**: Integrar controles de login/logout en la navegación existente
- **Pasos**:
  1. Modificar `components/navbar.tsx`
  2. Agregar lógica de sesión usando hooks de Supabase UI
  3. Mostrar botón de login o logout según estado
  4. Agregar información del usuario
- **Criterios de Aceptación**:
  - [ ] Muestra "Iniciar sesión" cuando no hay sesión
  - [ ] Muestra email del usuario cuando hay sesión
  - [ ] Botón de logout funciona correctamente
  - [ ] No rompe el diseño existente
- **Archivo**: `components/navbar.tsx`
- **Nota**: Este componente cubre RF-005

### **FASE 3: Verificación de Páginas de Autenticación**

#### **TAREA 3.1: Verificar Página de Login**
- **Estado**: ⏳ Pendiente
- **Descripción**: Verificar que la página de login funciona correctamente
- **Pasos**:
  1. Verificar que `app/login/page.tsx` existe (creada por Supabase UI)
  2. Probar funcionalidad de login
  3. Verificar redirección post-login
  4. **IMPORTANTE**: No modificar componentes nativos de Supabase UI
- **Criterios de Aceptación**:
  - [ ] Página se renderiza correctamente
  - [ ] Login funciona con credenciales válidas
  - [ ] Maneja errores apropiadamente
  - [ ] Redirige al dashboard después del login
- **Archivo**: `app/login/page.tsx` (ya creado por Supabase UI)
- **Nota**: Este componente cubre RF-002 automáticamente

#### **TAREA 3.2: Verificar Página de Registro**
- **Estado**: ⏳ Pendiente
- **Descripción**: Verificar que la página de registro funciona correctamente
- **Pasos**:
  1. Verificar que `app/register/page.tsx` existe (creada por Supabase UI)
  2. Probar funcionalidad de registro
  3. Verificar envío de email de confirmación
  4. **IMPORTANTE**: No modificar componentes nativos de Supabase UI
- **Criterios de Aceptación**:
  - [ ] Página se renderiza correctamente
  - [ ] Registro funciona con datos válidos
  - [ ] Maneja errores apropiadamente
  - [ ] Envía email de confirmación
- **Archivo**: `app/register/page.tsx` (ya creado por Supabase UI)
- **Nota**: Este componente cubre RF-001 automáticamente

#### **TAREA 3.3: Verificar Páginas de Confirmación y Reset**
- **Estado**: ⏳ Pendiente
- **Descripción**: Verificar que las páginas de confirmación y reset funcionan
- **Pasos**:
  1. Verificar `app/auth/confirm/page.tsx` (creada por Supabase UI)
  2. Verificar `app/auth/reset-password/page.tsx` (creada por Supabase UI)
  3. Probar flujos de confirmación y reset
  4. **IMPORTANTE**: No modificar componentes nativos de Supabase UI
- **Criterios de Aceptación**:
  - [ ] Confirmación de email funciona
  - [ ] Reset de contraseña funciona
  - [ ] Páginas manejan errores correctamente
  - [ ] Redirecciones funcionan apropiadamente
- **Nota**: Estos componentes cubren RF-003 automáticamente

### **FASE 4: Protección de Rutas**

#### **TAREA 4.1: Proteger Dashboard Principal**
- **Estado**: ⏳ Pendiente
- **Descripción**: Aplicar AuthGuard al dashboard principal
- **Pasos**:
  1. Modificar `app/page.tsx`
  2. Envolver contenido con AuthGuard
  3. Configurar para requerir admin
- **Criterios de Aceptación**:
  - [ ] Usuarios no autenticados son redirigidos a login
  - [ ] Usuarios no admin son redirigidos a login
  - [ ] Admin puede acceder normalmente
  - [ ] No causa errores de renderizado
- **Archivo**: `app/page.tsx`

#### **TAREA 4.2: Proteger Páginas de Préstamos**
- **Estado**: ⏳ Pendiente
- **Descripción**: Aplicar AuthGuard a las páginas de detalle de préstamos
- **Pasos**:
  1. Modificar `app/prestamos/[id]/page.tsx`
  2. Envolver contenido con AuthGuard
  3. Configurar para requerir admin
- **Criterios de Aceptación**:
  - [ ] Usuarios no autenticados son redirigidos a login
  - [ ] Usuarios no admin son redirigidos a login
  - [ ] Admin puede acceder normalmente
  - [ ] Skeleton loading funciona correctamente
- **Archivo**: `app/prestamos/[id]/page.tsx`

#### **TAREA 4.3: Crear Middleware (Opcional)**
- **Estado**: ⏳ Pendiente
- **Descripción**: Implementar middleware para protección a nivel de servidor
- **Pasos**:
  1. Crear `middleware.ts` en la raíz
  2. Implementar lógica de protección de rutas
  3. Configurar matcher para rutas protegidas
- **Criterios de Aceptación**:
  - [ ] Middleware se ejecuta correctamente
  - [ ] Protege rutas a nivel de servidor
  - [ ] No causa loops de redirección
  - [ ] Funciona con AuthGuard en cliente
- **Archivo**: `middleware.ts`

### **FASE 5: Pruebas y Verificación**

#### **TAREA 5.1: Pruebas de Flujo de Autenticación**
- **Estado**: ⏳ Pendiente
- **Descripción**: Probar todos los flujos de autenticación
- **Pasos**:
  1. Probar registro de nuevo usuario
  2. Probar login con credenciales válidas
  3. Probar login con credenciales inválidas
  4. Probar logout
  5. Probar reset de contraseña
- **Criterios de Aceptación**:
  - [ ] Registro funciona end-to-end
  - [ ] Login funciona con credenciales correctas
  - [ ] Login maneja errores apropiadamente
  - [ ] Logout limpia la sesión correctamente
  - [ ] Reset de contraseña funciona

#### **TAREA 5.2: Pruebas de Protección de Rutas**
- **Estado**: ⏳ Pendiente
- **Descripción**: Verificar que las rutas están correctamente protegidas
- **Pasos**:
  1. Probar acceso sin autenticación
  2. Probar acceso con usuario normal (no admin)
  3. Probar acceso con admin
  4. Probar redirecciones
- **Criterios de Aceptación**:
  - [ ] Rutas protegidas redirigen a login
  - [ ] Usuarios no admin no pueden acceder
  - [ ] Admin puede acceder a todas las rutas
  - [ ] Redirecciones funcionan correctamente

#### **TAREA 5.3: Pruebas de UI/UX**
- **Estado**: ⏳ Pendiente
- **Descripción**: Verificar que la interfaz funciona correctamente
- **Pasos**:
  1. Probar navegación en diferentes estados
  2. Verificar que los componentes se renderizan correctamente
  3. Probar responsive design
  4. Verificar accesibilidad básica
- **Criterios de Aceptación**:
  - [ ] Navbar funciona en todos los estados
  - [ ] Formularios son responsivos
  - [ ] Mensajes de error son claros
  - [ ] Loading states funcionan correctamente

### **FASE 6: Documentación y Limpieza**

#### **TAREA 6.1: Documentar Implementación**
- **Estado**: ⏳ Pendiente
- **Descripción**: Crear documentación de la implementación
- **Pasos**:
  1. Documentar componentes creados
  2. Documentar flujos de autenticación
  3. Documentar configuración necesaria
  4. Crear guía de uso
- **Criterios de Aceptación**:
  - [ ] Documentación está completa
  - [ ] Guía de uso es clara
  - [ ] Configuración está documentada
  - [ ] Troubleshooting está incluido

#### **TAREA 6.2: Limpieza y Optimización**
- **Estado**: ⏳ Pendiente
- **Descripción**: Limpiar código y optimizar implementación
- **Pasos**:
  1. Revisar y limpiar código no utilizado
  2. Optimizar imports
  3. Verificar que no hay warnings
  4. Optimizar bundle size si es necesario
- **Criterios de Aceptación**:
  - [ ] No hay código no utilizado
  - [ ] No hay warnings en consola
  - [ ] Imports están optimizados
  - [ ] Bundle size es razonable

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
- 🔧 `auth-guard.tsx` - Protección de rutas
- 🔧 `session-manager.tsx` - Gestión de sesión
- 🔧 `navbar.tsx` - Navegación actualizada

### **Dependencias**
- Supabase UI debe estar instalado correctamente
- Variables de entorno deben estar configuradas
- shadcn/ui debe estar funcionando

### **Siguientes Pasos (Fase 2)**
- Implementar RLS (Row Level Security) en Supabase
- Agregar columna `user_id` a tablas existentes
- Filtrar datos por usuario
- Implementar roles más granulares

---

## 📊 **7. SEGUIMIENTO DE PROGRESO**

### **Estado General del Proyecto**
- **Progreso Total**: 0% (0/15 tareas completadas)
- **Fase Actual**: Fase 1 - Configuración Inicial
- **Próxima Tarea**: TAREA 1.1 - Verificar Configuración de Supabase

### **Resumen por Fase**
- **Fase 1**: 0/3 tareas completadas
- **Fase 2**: 0/3 tareas completadas
- **Fase 3**: 0/3 tareas completadas
- **Fase 4**: 0/3 tareas completadas
- **Fase 5**: 0/3 tareas completadas
- **Fase 6**: 0/2 tareas completadas

### **Tareas Críticas**
- [ ] TAREA 1.1: Verificar Configuración de Supabase
- [ ] TAREA 1.2: Instalar Supabase UI
- [ ] TAREA 2.1: Crear AuthGuard Component
- [ ] TAREA 4.1: Proteger Dashboard Principal

---

**Documento actualizado**: Enero 2024
**Responsable**: [Nombre del desarrollador]
**Estado**: En Desarrollo
