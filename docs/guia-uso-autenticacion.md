# Guía de Uso: Sistema de Autenticación

## 🚀 Inicio Rápido

### Para Administradores

#### 1. Acceso al Sistema
- **URL**: `http://localhost:3000` (desarrollo)
- **Email**: `info@bytesandbuilds.com` (configurado como admin)
- **Contraseña**: La que hayas configurado durante el registro

#### 2. Funcionalidades Disponibles
- ✅ Dashboard completo
- ✅ Gestión de préstamos
- ✅ Acceso a detalles de préstamos
- ✅ Todas las funcionalidades existentes

#### 3. Navegación
- **Dashboard**: `/` (página principal)
- **Detalle de Préstamo**: `/prestamos/[id]`
- **Cerrar Sesión**: Botón en navbar → "Cerrar sesión"

### Para Deudores (Usuarios Registrados)

#### 1. Registro
- **URL**: `http://localhost:3000/auth/sign-up`
- **Proceso**:
  1. Completar formulario de registro
  2. Verificar email recibido
  3. Confirmar cuenta desde el email

#### 2. Acceso
- **URL**: `http://localhost:3000/auth/login`
- **Proceso**:
  1. Ingresar email y contraseña
  2. Sistema redirige según rol

#### 3. Estado Actual
- ⏳ **Acceso limitado** (pendiente FASE 7)
- ⏳ **Vistas condicionales** (pendiente implementación)

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=tu_publishable_key

# Admin
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=email_del_admin@ejemplo.com
```

### Verificación de Configuración

1. **Verificar Supabase**:
   ```bash
   # Verificar conexión
   curl -I http://localhost:3000/auth/login
   # Debe retornar 200
   ```

2. **Verificar Admin**:
   - Intentar login con email configurado
   - Debe acceder al dashboard sin problemas

## 🛠️ Troubleshooting

### Problema: "No puedo acceder al dashboard"

**Posibles Causas**:
1. **No estás autenticado**
   - Solución: Ir a `/auth/login`
   - Verificar credenciales

2. **No eres admin**
   - Solución: Verificar que tu email está en `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`
   - Solo admins pueden acceder al dashboard

3. **Error de configuración**
   - Solución: Verificar variables de entorno
   - Reiniciar servidor de desarrollo

### Problema: "Error al registrarme"

**Posibles Causas**:
1. **Email ya existe**
   - Solución: Usar email diferente o recuperar contraseña

2. **Contraseña débil**
   - Solución: Usar contraseña más fuerte (mínimo 6 caracteres)

3. **Problema de red**
   - Solución: Verificar conexión a internet
   - Verificar configuración de Supabase

### Problema: "No recibo email de confirmación"

**Posibles Causas**:
1. **Email en spam**
   - Solución: Revisar carpeta de spam

2. **Email incorrecto**
   - Solución: Verificar dirección de email

3. **Problema de Supabase**
   - Solución: Verificar configuración de email en Supabase

## 📱 Uso en Diferentes Dispositivos

### Desktop
- ✅ Funciona completamente
- ✅ Responsive design
- ✅ Todas las funcionalidades

### Mobile
- ✅ Funciona completamente
- ✅ Touch-friendly
- ✅ Responsive design

### Tablet
- ✅ Funciona completamente
- ✅ Optimizado para pantalla media

## 🔐 Seguridad

### Medidas Implementadas
- ✅ Autenticación por email/contraseña
- ✅ Protección de rutas
- ✅ Validación de roles
- ✅ Middleware de seguridad
- ✅ Redirecciones seguras

### Recomendaciones
1. **Usar contraseñas fuertes**
2. **No compartir credenciales**
3. **Cerrar sesión al terminar**
4. **Verificar emails de confirmación**

## 📞 Soporte

### Para Problemas Técnicos
1. Verificar logs del servidor
2. Revisar consola del navegador
3. Comprobar configuración de variables de entorno
4. Verificar conexión a Supabase

### Para Problemas de Usuario
1. Verificar credenciales
2. Comprobar estado de confirmación de email
3. Intentar recuperación de contraseña
4. Contactar al administrador del sistema

## 🔄 Próximas Actualizaciones

### FASE 7 (Pendiente)
- 🔄 Acceso para deudores
- 🔄 Vistas condicionales
- 🔄 Asociación de préstamos con usuarios
- 🔄 Row Level Security (RLS)

### Mejoras Futuras
- 🔄 Autenticación social
- 🔄 Autenticación de dos factores
- 🔄 Gestión de permisos granular
- 🔄 Auditoría de sesiones

---

**Última Actualización**: Enero 2025  
**Versión**: 1.0  
**Compatibilidad**: Next.js 15.2.4, Supabase UI
