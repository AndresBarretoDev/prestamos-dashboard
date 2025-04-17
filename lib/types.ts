export interface Deudor {
  id: string
  nombre: string
  cedula: string
  ciudad?: string
  telefono: string
  creado_en?: string
}

export interface Prestamo {
  id: string
  deudor: Deudor
  deudor_id: string
  monto: number
  tasa_mensual: number
  cuotas: number
  cuota_mensual: number
  fecha_inicio: string
  estado: "activo" | "pagado" | "vencido"
  observaciones?: string
  creado_en?: string
  cuotasPagadas?: number
  tablaAmortizacion: Cuota[]
  gananciaTotal: number
  totalPagado: number
}

export interface Cuota {
  id?: string
  prestamo_id: string
  numero: number
  fecha_vencimiento: string
  valor: number
  interes: number
  abono_capital: number
  estado: "pagada" | "pendiente" | "vencida"
  pagado_en?: string | null
}

export interface Pago {
  id: string
  prestamo_id: string
  cuota_id: string
  valor_pagado: number
  fecha_pago: string
  observacion?: string
}

export interface Notificacion {
  id: string
  cuota_id: string
  enviado_en: string
  medio: string
  estado: "enviado" | "error"
  mensaje?: string
}
