export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            deudores: {
                Row: {
                    id: string
                    nombre: string
                    cedula: string
                    ciudad: string | null
                    telefono: string
                    creado_en: string
                }
                Insert: {
                    id?: string
                    nombre: string
                    cedula: string
                    ciudad?: string | null
                    telefono: string
                    creado_en?: string
                }
                Update: {
                    id?: string
                    nombre?: string
                    cedula?: string
                    ciudad?: string | null
                    telefono?: string
                    creado_en?: string
                }
            }
            prestamos: {
                Row: {
                    id: string
                    deudor_id: string
                    monto: number
                    tasa_mensual: number
                    cuotas: number
                    cuota_mensual: number
                    fecha_inicio: string
                    estado: 'activo' | 'pagado' | 'vencido'
                    observaciones: string | null
                    creado_en: string
                }
                Insert: {
                    id?: string
                    deudor_id: string
                    monto: number
                    tasa_mensual: number
                    cuotas: number
                    cuota_mensual: number
                    fecha_inicio: string
                    estado: 'activo' | 'pagado' | 'vencido'
                    observaciones?: string | null
                    creado_en?: string
                }
                Update: {
                    id?: string
                    deudor_id?: string
                    monto?: number
                    tasa_mensual?: number
                    cuotas?: number
                    cuota_mensual?: number
                    fecha_inicio?: string
                    estado?: 'activo' | 'pagado' | 'vencido'
                    observaciones?: string | null
                    creado_en?: string
                }
            }
            cuotas: {
                Row: {
                    id: string
                    prestamo_id: string
                    numero: number
                    fecha_vencimiento: string
                    valor: number
                    interes: number
                    abono_capital: number
                    estado: 'pagada' | 'pendiente' | 'vencida'
                    pagado_en: string | null
                }
                Insert: {
                    id?: string
                    prestamo_id: string
                    numero: number
                    fecha_vencimiento: string
                    valor: number
                    interes: number
                    abono_capital: number
                    estado: 'pagada' | 'pendiente' | 'vencida'
                    pagado_en?: string | null
                }
                Update: {
                    id?: string
                    prestamo_id?: string
                    numero?: number
                    fecha_vencimiento?: string
                    valor?: number
                    interes?: number
                    abono_capital?: number
                    estado?: 'pagada' | 'pendiente' | 'vencida'
                    pagado_en?: string | null
                }
            }
            pagos: {
                Row: {
                    id: string
                    prestamo_id: string
                    cuota_id: string
                    valor_pagado: number
                    fecha_pago: string
                    observacion: string | null
                }
                Insert: {
                    id?: string
                    prestamo_id: string
                    cuota_id: string
                    valor_pagado: number
                    fecha_pago?: string
                    observacion?: string | null
                }
                Update: {
                    id?: string
                    prestamo_id?: string
                    cuota_id?: string
                    valor_pagado?: number
                    fecha_pago?: string
                    observacion?: string | null
                }
            }
            notificaciones: {
                Row: {
                    id: string
                    cuota_id: string
                    enviado_en: string
                    medio: string
                    estado: 'enviado' | 'error'
                    mensaje: string | null
                }
                Insert: {
                    id?: string
                    cuota_id: string
                    enviado_en?: string
                    medio: string
                    estado: 'enviado' | 'error'
                    mensaje?: string | null
                }
                Update: {
                    id?: string
                    cuota_id?: string
                    enviado_en?: string
                    medio?: string
                    estado?: 'enviado' | 'error'
                    mensaje?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
} 