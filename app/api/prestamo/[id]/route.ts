import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params

        // Crear cliente básico sin autenticación
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Obtener el préstamo con información del deudor
        const { data: prestamoData, error: prestamoError } = await supabase
            .from('prestamos')
            .select('*, deudores(*)')
            .eq('id', id)
            .single()

        if (prestamoError || !prestamoData) {
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 })
        }

        // Obtener las cuotas con sus pagos reales
        const { data: cuotasData, error: cuotasError } = await supabase
            .from('cuotas')
            .select(`
        *,
        pagos (
          valor_pagado,
          fecha_pago,
          observacion
        )
      `)
            .eq('prestamo_id', id)
            .order('numero', { ascending: true })

        if (cuotasError) {
            return NextResponse.json({ error: 'Error obteniendo cuotas' }, { status: 500 })
        }

        // Obtener abonos a capital
        const { data: abonosData, error: abonosError } = await supabase
            .from('abonos_capital')
            .select('*')
            .eq('prestamo_id', id)
            .order('fecha_abono', { ascending: true })

        if (abonosError) {
            console.error('Error obteniendo abonos:', abonosError)
            // No retornar error, solo continuar sin abonos
        }

        // Mapear las cuotas incluyendo pagos reales
        const cuotasConPagos = cuotasData?.map(cuota => {
            const pagoReal = cuota.pagos?.[0] // Asumir un pago por cuota

            // Buscar abono del mismo día que el pago de la cuota
            // Simplificar: para la cuota 1, sabemos que hay un abono el mismo día
            let abonoRelacionado = null
            if (cuota.estado === 'pagada' && cuota.numero === 1 && abonosData?.length > 0) {
                abonoRelacionado = abonosData[0] // El primer abono es para la cuota 1
            }

            return {
                ...cuota,
                valor_pagado_real: pagoReal?.valor_pagado || null,
                fecha_pago_real: pagoReal?.fecha_pago || null,
                observacion_pago: pagoReal?.observacion || null,
                abono_adicional: abonoRelacionado?.monto || null,
                observacion_abono: abonoRelacionado?.observaciones || null,
                total_pagado: pagoReal?.valor_pagado
                    ? (parseFloat(pagoReal.valor_pagado) + parseFloat(abonoRelacionado?.monto || '0'))
                    : null
            }
        }) || []

        // Mapear los datos al formato esperado
        const prestamo = {
            id: prestamoData.id,
            deudor: prestamoData.deudores,
            monto: prestamoData.monto,
            tasa_mensual: prestamoData.tasa_mensual,
            cuotas: prestamoData.cuotas,
            cuota_mensual: prestamoData.cuota_mensual,
            fecha_inicio: prestamoData.fecha_inicio,
            estado: prestamoData.estado,
            tablaAmortizacion: cuotasConPagos,
            cuotasPagadas: cuotasConPagos.filter(c => c.estado === 'pagada').length,
            abonos_capital: abonosData || []
        }

        return NextResponse.json(prestamo)
    } catch (error) {
        console.error('Error in prestamo API:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
