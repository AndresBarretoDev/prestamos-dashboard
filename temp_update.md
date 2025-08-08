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
