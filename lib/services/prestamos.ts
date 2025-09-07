import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import type { Prestamo, Deudor, Cuota } from '@/lib/types';
import { addMonths, format } from 'date-fns';
import { calcularCuotaMensual, calcularTablaAmortizacion } from '@/lib/calculadora';
import { formatCurrency } from '@/lib/utils';
import { computeLoanStats } from '@/lib/utils/loan-stats';

// Cliente Supabase que maneja sesiones automáticamente
const supabase = createClient();


// Función para obtener todos los préstamos
export async function getPrestamos(): Promise<Prestamo[]> {
    const { data: prestamosData, error } = await supabase
        .from('prestamos')
        .select('*, deudores(*)')
        .order('fecha_inicio', { ascending: false });

    if (error) {
        console.error('Error fetching prestamos:', error);
        return [];
    }

    // Para cada préstamo, obtenemos sus cuotas con pagos y abonos
    const prestamosWithCuotas = await Promise.all(
        prestamosData.map(async (prestamoWithDeudor) => {
            // Obtener cuotas con pagos
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
                .eq('prestamo_id', prestamoWithDeudor.id)
                .neq('estado', 'eliminada')  // Filtrar cuotas eliminadas
                .order('numero', { ascending: true });

            if (cuotasError) {
                console.error('Error fetching cuotas:', cuotasError);
                return mapPrestamoDBToModel(prestamoWithDeudor, []);
            }

            // Obtener abonos a capital
            const { data: abonosData, error: abonosError } = await supabase
                .from('abonos_capital')
                .select('*')
                .eq('prestamo_id', prestamoWithDeudor.id)
                .order('fecha_abono', { ascending: true });

            if (abonosError) {
                console.error('Error obteniendo abonos:', abonosError);
            }

            // Mapear las cuotas incluyendo pagos reales y abonos
            const cuotasConPagos = cuotasData?.map(cuota => {
                const pagoReal = cuota.pagos?.[0];

                // Buscar abono que sea específicamente excedente de esta cuota (por observación, no por fecha)
                const abonoRelacionado = cuota.estado === 'pagada' && abonosData
                    ? abonosData.find(abono => {
                        return abono.observaciones?.includes(`Excedente del pago de la cuota ${cuota.numero}`);
                    })
                    : null;

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
                };
            }) || [];

            return mapPrestamoDBToModel(prestamoWithDeudor, cuotasConPagos);
        })
    );

    return prestamosWithCuotas;
}

// Función para obtener un préstamo por su ID (versión simple)
export async function getPrestamo(id: string): Promise<Prestamo | null> {
    const { data, error } = await supabase
        .from('prestamos')
        .select('*, deudores(*)')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Error fetching prestamo:', error);
        return null;
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
        .neq('estado', 'eliminada')  // Filtrar cuotas eliminadas
        .order('numero', { ascending: true });

    if (cuotasError) {
        console.error('Error fetching cuotas:', cuotasError);
        return mapPrestamoDBToModel(data, []);
    }

    // Obtener abonos a capital
    const { data: abonosData, error: abonosError } = await supabase
        .from('abonos_capital')
        .select('*')
        .eq('prestamo_id', id)
        .order('fecha_abono', { ascending: true });

    if (abonosError) {
        console.error('Error obteniendo abonos:', abonosError);
    }

    // Mapear las cuotas incluyendo pagos reales y abonos
    const cuotasConPagos = cuotasData?.map(cuota => {
        const pagoReal = cuota.pagos?.[0]; // Asumir un pago por cuota

        // Buscar abono que sea específicamente excedente de esta cuota (por observación, no por fecha)
        const abonoRelacionado = cuota.estado === 'pagada' && abonosData
            ? abonosData.find(abono => {
                return abono.observaciones?.includes(`Excedente del pago de la cuota ${cuota.numero}`);
            })
            : null;

        const cuotaConPagos = {
            ...cuota,
            valor_pagado_real: pagoReal?.valor_pagado || null,
            fecha_pago_real: pagoReal?.fecha_pago || null,
            observacion_pago: pagoReal?.observacion || null,
            abono_adicional: abonoRelacionado?.monto || null,
            observacion_abono: abonoRelacionado?.observaciones || null,
            total_pagado: pagoReal?.valor_pagado
                ? (parseFloat(pagoReal.valor_pagado) + parseFloat(abonoRelacionado?.monto || '0'))
                : null
        };



        return cuotaConPagos;
    }) || [];

    return mapPrestamoDBToModel(data, cuotasConPagos);
}

// Función para obtener un préstamo con datos completos (incluyendo pagos y abonos)
export async function getPrestamoCompleto(id: string): Promise<Prestamo | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/prestamos?id=eq.${id}&select=*,deudores(*)`, {
            headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) return null;

        const prestamoData = await response.json();
        if (!prestamoData[0]) return null;

        // Usar la misma lógica que la API pública
        const { data: cuotasData } = await supabase
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
            .neq('estado', 'eliminada')  // Filtrar cuotas eliminadas
            .order('numero', { ascending: true });

        const { data: abonosData } = await supabase
            .from('abonos_capital')
            .select('*')
            .eq('prestamo_id', id)
            .order('fecha_abono', { ascending: true });

        const cuotasConPagos = cuotasData?.map(cuota => {
            const pagoReal = cuota.pagos?.[0];
            // Buscar abono que sea específicamente excedente de esta cuota (por observación, no por fecha)
            const abonoRelacionado = cuota.estado === 'pagada' && abonosData
                ? abonosData.find(abono => {
                    return abono.observaciones?.includes(`Excedente del pago de la cuota ${cuota.numero}`);
                })
                : null;

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
            };
        }) || [];

        return mapPrestamoDBToModel(prestamoData[0], cuotasConPagos);
    } catch (error) {
        console.error('Error fetching prestamo completo:', error);
        return null;
    }
}

// Función para crear un nuevo préstamo
export async function createPrestamo(formData: {
    nombre: string;
    cedula: string;
    ciudad: string;
    telefono: string;
    monto: number;
    tasa_mensual: number;
    cuotas: number;
    cuota_mensual: number;
    fecha_inicio: string;
    tablaAmortizacion: Cuota[];
}): Promise<Prestamo | null> {
    // Primero verificamos si el deudor ya existe
    const { data: deudorExistente, error: deudorError } = await supabase
        .from('deudores')
        .select('*')
        .eq('cedula', formData.cedula)
        .maybeSingle();

    // Si hay un error, retornamos null
    if (deudorError) {
        console.error('Error checking deudor existence:', deudorError);
        return null;
    }

    let deudorId: string;

    // Si el deudor no existe, lo creamos
    if (!deudorExistente) {
        const { data: nuevoDeudor, error: errorCrearDeudor } = await supabase
            .from('deudores')
            .insert({
                nombre: formData.nombre,
                cedula: formData.cedula,
                ciudad: formData.ciudad || null,
                telefono: formData.telefono
            })
            .select()
            .single();

        if (errorCrearDeudor || !nuevoDeudor) {
            console.error('Error creating deudor:', errorCrearDeudor);
            return null;
        }

        deudorId = nuevoDeudor.id;
    } else {
        deudorId = deudorExistente.id;
    }

    // Creamos el préstamo
    const { data: nuevoPrestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .insert({
            deudor_id: deudorId,
            monto: formData.monto,
            tasa_mensual: formData.tasa_mensual,
            cuotas: formData.cuotas,
            cuota_mensual: formData.cuota_mensual,
            fecha_inicio: formData.fecha_inicio,
            estado: 'activo'
        })
        .select()
        .single();

    if (prestamoError || !nuevoPrestamo) {
        console.error('Error creating prestamo:', prestamoError);
        return null;
    }

    // Crear las cuotas
    const cuotasToInsert = formData.tablaAmortizacion.map((cuota) => {
        return {
            prestamo_id: nuevoPrestamo.id,
            numero: cuota.numero,
            fecha_vencimiento: cuota.fecha_vencimiento,
            valor: cuota.valor,
            interes: cuota.interes,
            abono_capital: cuota.abono_capital,
            estado: 'pendiente'
        };
    });

    const { error: cuotasError } = await supabase
        .from('cuotas')
        .insert(cuotasToInsert);

    if (cuotasError) {
        console.error('Error creating cuotas:', cuotasError);
        // Aquí podrías implementar un rollback del préstamo
        return null;
    }

    // Obtenemos el préstamo recién creado con todas sus relaciones
    return getPrestamo(nuevoPrestamo.id);
}

// Función para actualizar un préstamo
export async function updatePrestamo(id: string, data: {
    nombre?: string;
    cedula?: string;
    ciudad?: string;
    telefono?: string;
    estado?: 'activo' | 'pagado' | 'vencido';
    observaciones?: string;
}): Promise<Prestamo | null> {
    // Primero obtenemos el préstamo actual para conocer su deudor_id
    const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .select('deudor_id')
        .eq('id', id)
        .single();

    if (prestamoError || !prestamo) {
        console.error('Error fetching prestamo for update:', prestamoError);
        return null;
    }

    // Actualizamos información del deudor si hay campos para actualizar
    if (data.nombre || data.cedula || data.ciudad || data.telefono) {
        const deudorUpdate: any = {};
        if (data.nombre) deudorUpdate.nombre = data.nombre;
        if (data.cedula) deudorUpdate.cedula = data.cedula;
        if (data.ciudad) deudorUpdate.ciudad = data.ciudad;
        if (data.telefono) deudorUpdate.telefono = data.telefono;

        const { error: deudorError } = await supabase
            .from('deudores')
            .update(deudorUpdate)
            .eq('id', prestamo.deudor_id);

        if (deudorError) {
            console.error('Error updating deudor:', deudorError);
            return null;
        }
    }

    // Actualizamos información del préstamo si hay campos para actualizar
    if (data.estado || data.observaciones) {
        const prestamoUpdate: any = {};
        if (data.estado) prestamoUpdate.estado = data.estado;
        if (data.observaciones) prestamoUpdate.observaciones = data.observaciones;

        const { error: updateError } = await supabase
            .from('prestamos')
            .update(prestamoUpdate)
            .eq('id', id);

        if (updateError) {
            console.error('Error updating prestamo:', updateError);
            return null;
        }
    }

    // Devolvemos el préstamo actualizado
    return getPrestamo(id);
}

// Función para registrar un abono a capital
export async function registrarAbonoCapital(
    prestamoId: string,
    data: {
        monto: number;
        fecha_abono: string;
        observaciones?: string;
        tipo_recalculo: 'reducir_cuota' | 'reducir_plazo';
    }
): Promise<Prestamo | null> {
    try {
        console.log(`📊 INICIANDO REGISTRO DE ABONO: ${data.monto} para préstamo ${prestamoId}`);
        
        // Intentar RPC primero
        console.log(`🔧 INTENTANDO RPC recalc_prestamo_after_abono...`);
        const { error: rpcError } = await supabase.rpc('recalc_prestamo_after_abono', {
            p_prestamo: prestamoId,
            p_monto: data.monto,
            p_fecha: data.fecha_abono,
            p_tipo: data.tipo_recalculo
        });

        // Si RPC funciona, usar ese resultado
        if (!rpcError) {
            console.log(`✅ RPC EXITOSO, obteniendo préstamo actualizado`);
            const prestamoActualizado = await getPrestamo(prestamoId);
            
            if (prestamoActualizado) {
                console.log(`📊 PRÉSTAMO ACTUALIZADO:`, {
                    cuotas: prestamoActualizado.cuotas,
                    cuotasPagadas: prestamoActualizado.cuotasPagadas,
                    estado: prestamoActualizado.estado,
                    totalCuotasEnTabla: prestamoActualizado.tablaAmortizacion.length,
                    cuotasPagadasEnTabla: prestamoActualizado.tablaAmortizacion.filter(c => c.estado === 'pagada').length,
                    cuotasPendientesEnTabla: prestamoActualizado.tablaAmortizacion.filter(c => c.estado === 'pendiente').length
                });
                
                // Verificar stats computed
                const stats = computeLoanStats(prestamoActualizado);
                console.log(`📈 STATS COMPUTADAS:`, stats);
            }
            
            return prestamoActualizado;
        }

        // Fallback: implementar recálculo transaccional desde frontend
        console.warn('🚨 RPC FALLÓ, usando fallback frontend:', rpcError);
        console.log(`🔄 EJECUTANDO RECÁLCULO TRANSACCIONAL FRONTEND...`);
        return await recalcularPrestamoTransaccional(prestamoId, data);

    } catch (error) {
        console.error('Error en registrarAbonoCapital:', error);
        return null;
    }
}

// Implementación de recálculo transaccional desde frontend según flujo-y-escenarios-abonos.md
async function recalcularPrestamoTransaccional(
    prestamoId: string,
    data: {
        monto: number;
        fecha_abono: string;
        observaciones?: string;
        tipo_recalculo: 'reducir_cuota' | 'reducir_plazo';
    }
): Promise<Prestamo | null> {
    try {
        // 1. Obtener préstamo actual
        const prestamo = await getPrestamo(prestamoId);
        if (!prestamo) return null;

        // 2. Calcular capital pendiente real según computeLoanStats
        const stats = computeLoanStats(prestamo);
        const capitalPendienteReal = stats.capitalPendienteReal;

        // 3. Validar que abono no exceda capital pendiente
        if (data.monto > capitalPendienteReal) {
            throw new Error(`El monto del abono (${formatCurrency(data.monto)}) excede el capital pendiente (${formatCurrency(capitalPendienteReal)})`);
        }

        // 4. Insertar abono a capital
        const { error: abonoError } = await supabase
            .from('abonos_capital')
            .insert({
                prestamo_id: prestamoId,
                monto: data.monto,
                fecha_abono: data.fecha_abono,
                observaciones: data.observaciones || '',
                tipo_recalculo: data.tipo_recalculo
            });

        if (abonoError) {
            console.error('Error insertando abono:', abonoError);
            return null;
        }

        // 5. Verificar cuotas antes del DELETE
        const { data: cuotasAntesDelete, error: errorAntesDelete } = await supabase
            .from('cuotas')
            .select('numero, estado')
            .eq('prestamo_id', prestamoId)
            .order('numero');

        if (errorAntesDelete) {
            console.error('Error obteniendo cuotas antes de DELETE:', errorAntesDelete);
            return null;
        }

        console.log('DEBUG: Cuotas antes de DELETE:', cuotasAntesDelete?.map(c => `${c.numero}:${c.estado}`));

        // Borrar cuotas no pagadas usando OR para manejar RLS
        const { error: deleteError, count: deletedCount } = await supabase
            .from('cuotas')
            .delete({ count: 'exact' })
            .eq('prestamo_id', prestamoId)
            .in('estado', ['pendiente', 'vencida']); // Usar IN en lugar de neq

        // Si el DELETE no funcionó (RLS), intentar DELETE individual o usar estrategia alternativa
        if (deleteError || deletedCount === 0) {
            console.error('DELETE masivo bloqueado por RLS:', deleteError);
            console.warn('Intentando DELETE individual por cuota...');
            
            // Obtener las cuotas a eliminar individualmente
            const { data: cuotasAEliminar } = await supabase
                .from('cuotas')
                .select('id, numero')
                .eq('prestamo_id', prestamoId)
                .in('estado', ['pendiente', 'vencida']);
            
            if (cuotasAEliminar && cuotasAEliminar.length > 0) {
                console.log(`Intentando eliminar ${cuotasAEliminar.length} cuotas individualmente...`);
                
                // Intentar eliminar una por una
                let eliminadasExitosamente = 0;
                for (const cuota of cuotasAEliminar) {
                    const { error: deleteIndividualError } = await supabase
                        .from('cuotas')
                        .delete()
                        .eq('id', cuota.id);
                    
                    if (!deleteIndividualError) {
                        eliminadasExitosamente++;
                    } else {
                        console.error(`Error eliminando cuota ${cuota.numero}:`, deleteIndividualError);
                    }
                }
                
                if (eliminadasExitosamente === 0) {
                    console.error('No se pudo eliminar ninguna cuota. RLS está bloqueando completamente.');
                    throw new Error('No se pueden eliminar las cuotas existentes para el recálculo. Contacte al administrador.');
                }
                
                console.log(`✅ Se eliminaron ${eliminadasExitosamente} de ${cuotasAEliminar.length} cuotas`);
            }
        } else {
            console.log(`✅ DELETE masivo exitoso: Se borraron ${deletedCount} cuotas no pagadas`);
        }

        // Verificar cuotas después del DELETE
        const { data: cuotasDespuesDelete, error: errorDespuesDelete } = await supabase
            .from('cuotas')
            .select('numero, estado')
            .eq('prestamo_id', prestamoId)
            .order('numero');

        if (errorDespuesDelete) {
            console.error('Error obteniendo cuotas después de DELETE:', errorDespuesDelete);
            return null;
        }

        console.log('DEBUG: Cuotas después de DELETE:', cuotasDespuesDelete?.map(c => `${c.numero}:${c.estado}`));

        // 6. Obtener max numero de cuota pagada DESPUÉS del DELETE
        const { data: maxPagada, error: maxError } = await supabase
            .from('cuotas')
            .select('numero')
            .eq('prestamo_id', prestamoId)
            .eq('estado', 'pagada')
            .order('numero', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (maxError) {
            console.error('Error obteniendo max cuota pagada:', maxError);
            return null;
        }

        const maxNumeroPagado = maxPagada?.numero || 0;

        // 7. El abono ya fue registrado, por lo que capitalPendienteReal ya incluye el descuento
        // NO debemos restar el monto otra vez - sería doble descuento
        const nuevoCapitalPendiente = capitalPendienteReal;
        
        console.log(`💰 CÁLCULO CAPITAL CORREGIDO:`, {
            capitalPendienteReal: capitalPendienteReal,
            montoAbonoYaAplicado: data.monto,
            nuevoCapitalPendiente: nuevoCapitalPendiente,
            cuotasPagadas: maxNumeroPagado,
            cuotasRestantes: prestamo.cuotas - maxNumeroPagado,
            nota: "El abono ya fue aplicado al calcular capitalPendienteReal"
        });

        // Si capital pendiente es 0 o menor, marcar como pagado
        if (nuevoCapitalPendiente <= 0) {
            const { error: updateError } = await supabase
                .from('prestamos')
                .update({ estado: 'pagado' })
                .eq('id', prestamoId);

            if (updateError) {
                console.error('Error actualizando estado préstamo:', updateError);
            }

            return getPrestamo(prestamoId);
        }

        // 8. Generar nuevas cuotas según tipo de recálculo
        const nuevasCuotas = await generarNuevasCuotas(
            prestamo,
            nuevoCapitalPendiente,
            maxNumeroPagado,
            data.tipo_recalculo
        );

        console.log(`DEBUG: Generando ${nuevasCuotas.length} nuevas cuotas desde número ${maxNumeroPagado + 1}`);

        // 9. Insertar/actualizar nuevas cuotas usando UPSERT para evitar conflictos
        if (nuevasCuotas.length > 0) {
            const { error: insertError } = await supabase
                .from('cuotas')
                .upsert(nuevasCuotas, { 
                    onConflict: 'prestamo_id,numero',
                    ignoreDuplicates: false 
                });

            if (insertError) {
                console.error('Error insertando nuevas cuotas:', insertError);
                console.error('Cuotas que se intentaron insertar:', nuevasCuotas.map(c => `${c.numero}`));
                return null;
            }

            // 10. Actualizar datos del préstamo
            const { error: updatePrestamoError } = await supabase
                .from('prestamos')
                .update({
                    cuota_mensual: nuevasCuotas[0]?.valor || prestamo.cuota_mensual,
                    cuotas: maxNumeroPagado + nuevasCuotas.length
                })
                .eq('id', prestamoId);

            if (updatePrestamoError) {
                console.error('Error actualizando préstamo:', updatePrestamoError);
            }
        }

        // Verificar si quedan cuotas pendientes tras el recálculo
        const prestamoActualizado = await getPrestamo(prestamoId);
        if (prestamoActualizado) {
            const statsActualizados = computeLoanStats(prestamoActualizado);
            
            // Si no hay cuotas pendientes, marcar como pagado
            if (statsActualizados.cuotasPendientes === 0 && prestamoActualizado.estado !== 'pagado') {
                const { error: updateEstadoError } = await supabase
                    .from('prestamos')
                    .update({ estado: 'pagado' })
                    .eq('id', prestamoId);

                if (updateEstadoError) {
                    console.error('Error actualizando estado final:', updateEstadoError);
                }

                return getPrestamo(prestamoId);
            }
        }

        return prestamoActualizado;

    } catch (error) {
        console.error('Error en recálculo transaccional:', error);
        throw error;
    }
}

// Función auxiliar para generar nuevas cuotas según tipo de recálculo
async function generarNuevasCuotas(
    prestamo: Prestamo,
    capitalPendiente: number,
    maxNumeroPagado: number,
    tipoRecalculo: 'reducir_cuota' | 'reducir_plazo'
): Promise<any[]> {
    const { calcularCuotaMensual, calcularTablaAmortizacion } = await import('@/lib/calculadora');
    
    let nuevaCuota: number;
    let nuevoNumeroMeses: number;

    if (tipoRecalculo === 'reducir_cuota') {
        // Mantener plazo original, recalcular cuota
        nuevoNumeroMeses = prestamo.cuotas - maxNumeroPagado;
        nuevaCuota = calcularCuotaMensual(capitalPendiente, prestamo.tasa_mensual, nuevoNumeroMeses);
        
        console.log(`🔢 CÁLCULO NUEVA CUOTA:`, {
            tipoRecalculo,
            capitalPendiente,
            tasaMensual: prestamo.tasa_mensual,
            nuevoNumeroMeses,
            nuevaCuota
        });
    } else {
        // Mantener cuota original, recalcular plazo
        const tasaDecimal = prestamo.tasa_mensual / 100;
        const cuotaActual = prestamo.cuota_mensual;
        
        // Validar que cuota sea viable: cuota > capital * tasa
        if (cuotaActual <= capitalPendiente * tasaDecimal) {
            throw new Error(`La cuota actual (${formatCurrency(cuotaActual)}) es insuficiente para cubrir los intereses`);
        }

        // Calcular nuevo plazo: n' = ceil(ln(C/(C-P*r)) / ln(1+r))
        const numerador = Math.log(cuotaActual / (cuotaActual - capitalPendiente * tasaDecimal));
        const denominador = Math.log(1 + tasaDecimal);
        nuevoNumeroMeses = Math.ceil(numerador / denominador);
        nuevaCuota = cuotaActual;
    }

    // Generar tabla con numeración desde maxNumeroPagado + 1
    const fechaInicioStr = prestamo.fecha_inicio;
    const tablaRecalculada = calcularTablaAmortizacion(
        capitalPendiente,
        prestamo.tasa_mensual,
        nuevoNumeroMeses,
        nuevaCuota,
        fechaInicioStr
    );

    // Renumerar desde maxNumeroPagado + 1
    return tablaRecalculada.map((cuota, index) => ({
        prestamo_id: prestamo.id,
        numero: maxNumeroPagado + index + 1,
        fecha_vencimiento: cuota.fecha_vencimiento,
        valor: cuota.valor,
        interes: cuota.interes,
        abono_capital: cuota.abono_capital,
        estado: 'pendiente'
    }));
}

// Función para obtener el historial de abonos a capital
export async function getAbonosCapital(prestamoId: string) {
    const { data, error } = await supabase
        .from('abonos_capital')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .order('fecha_abono', { ascending: false });

    if (error) {
        console.error('Error fetching abonos:', error);
        return [];
    }

    return data;
}

// Modificar la función markCuotaPagada para manejar excedentes
export async function markCuotaPagada(
    prestamoId: string,
    cuotaNumero: number,
    valorPagado: number = 0,
    registrarExcedente: boolean = true
): Promise<Prestamo | null> {
    // Obtener la cuota
    const { data: cuota, error: cuotaError } = await supabase
        .from('cuotas')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .eq('numero', cuotaNumero)
        .single();

    if (cuotaError || !cuota) {
        console.error('Error fetching cuota:', cuotaError);
        return null;
    }

    // Validar que el monto pagado no sea menor al valor de la cuota
    if (valorPagado < cuota.valor) {
        throw new Error(`El monto pagado (${formatCurrency(valorPagado)}) no puede ser menor al valor de la cuota (${formatCurrency(cuota.valor)})`);
    }

    // Marcar la cuota como pagada
    const fechaPago = new Date().toISOString();
    const { error: updateError } = await supabase
        .from('cuotas')
        .update({
            estado: 'pagada',
            pagado_en: fechaPago
        })
        .eq('id', cuota.id);

    if (updateError) {
        console.error('Error updating cuota:', updateError);
        return null;
    }

    // Registrar el pago
    const { error: pagoError } = await supabase
        .from('pagos')
        .insert({
            prestamo_id: prestamoId,
            cuota_id: cuota.id,
            valor_pagado: valorPagado > 0 ? valorPagado : cuota.valor,
            fecha_pago: fechaPago
        });

    if (pagoError) {
        console.error('Error registering pago:', pagoError);
        return null;
    }

    // Si el valor pagado es mayor que el valor de la cuota y se ha elegido registrar el excedente,
    // registrar el excedente como abono a capital
    if (valorPagado > cuota.valor && registrarExcedente) {
        const excedente = valorPagado - cuota.valor;
        console.log(`🔥 EXCEDENTE DETECTADO: Cuota ${cuotaNumero}, Excedente: ${excedente}, Valor cuota: ${cuota.valor}, Valor pagado: ${valorPagado}`);
        
        // Solo registrar si el excedente es significativo (más de 100 pesos)
        if (excedente >= 100) {
            console.log(`🚀 REGISTRANDO ABONO A CAPITAL: ${excedente}`);
            const resultadoAbono = await registrarAbonoCapital(prestamoId, {
                monto: excedente,
                fecha_abono: fechaPago,
                observaciones: `Excedente del pago de la cuota ${cuotaNumero}`,
                tipo_recalculo: 'reducir_cuota' // Por defecto, reducir la cuota
            });
            
            if (resultadoAbono) {
                console.log(`✅ ABONO REGISTRADO EXITOSAMENTE`);
            } else {
                console.error(`❌ ERROR AL REGISTRAR ABONO`);
            }
        } else {
            console.log(`⚠️ Excedente ${excedente} menor a 100, no se registra como abono`);
        }
    }

    // Verificar si todas las cuotas están pagadas (excluyendo eliminadas)
    const { data: cuotasPendientes, error: pendientesError } = await supabase
        .from('cuotas')
        .select('count')
        .eq('prestamo_id', prestamoId)
        .neq('estado', 'eliminada')  // Excluir eliminadas
        .not('estado', 'eq', 'pagada');

    if (pendientesError) {
        console.error('Error counting pending cuotas:', pendientesError);
        return null;
    }

    if (cuotasPendientes[0]?.count === 0) {
        // Si no hay cuotas pendientes, actualizar el estado del préstamo
        const { error: prestamoError } = await supabase
            .from('prestamos')
            .update({ estado: 'pagado' })
            .eq('id', prestamoId);

        if (prestamoError) {
            console.error('Error updating prestamo status:', prestamoError);
            return null;
        }
    }

    return getPrestamo(prestamoId);
}

// Función para actualizar un préstamo con nuevos términos y tabla de amortización
export async function updatePrestamoConNuevaAmortizacion(id: string, data: {
    monto: number;
    cuotas: number;
    tasa_mensual: number;
    fecha_inicio: string;
    cuota_mensual: number;
    tablaAmortizacion: Cuota[];
}): Promise<Prestamo | null> {
    // Primero obtenemos el préstamo actual para validar que existe
    const { data: prestamo, error: prestamoError } = await supabase
        .from('prestamos')
        .select('*')
        .eq('id', id)
        .single();

    if (prestamoError || !prestamo) {
        console.error('Error fetching prestamo for update:', prestamoError);
        return null;
    }

    // Actualizamos los datos principales del préstamo
    const { error: updateError } = await supabase
        .from('prestamos')
        .update({
            monto: data.monto,
            cuotas: data.cuotas,
            tasa_mensual: data.tasa_mensual,
            fecha_inicio: data.fecha_inicio,
            cuota_mensual: data.cuota_mensual
        })
        .eq('id', id);

    if (updateError) {
        console.error('Error updating prestamo:', updateError);
        return null;
    }

    // Eliminamos las cuotas existentes que no han sido pagadas
    const { error: deleteError } = await supabase
        .from('cuotas')
        .delete()
        .eq('prestamo_id', id)
        .eq('estado', 'pendiente');

    if (deleteError) {
        console.error('Error deleting existing cuotas:', deleteError);
        return null;
    }

    // Creamos las nuevas cuotas
    const cuotasToInsert = data.tablaAmortizacion
        .filter(cuota => cuota.estado === 'pendiente')
        .map((cuota) => ({
            prestamo_id: id,
            numero: cuota.numero,
            fecha_vencimiento: cuota.fecha_vencimiento,
            valor: cuota.valor,
            interes: cuota.interes,
            abono_capital: cuota.abono_capital,
            estado: 'pendiente'
        }));

    if (cuotasToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('cuotas')
            .insert(cuotasToInsert);

        if (insertError) {
            console.error('Error inserting new cuotas:', insertError);
            return null;
        }
    }

    // Devolvemos el préstamo actualizado
    return getPrestamo(id);
}

// Función auxiliar para convertir un préstamo de la BD al modelo de la aplicación
function mapPrestamoDBToModel(prestamoWithDeudor: any, cuotasDB: any[]): Prestamo {
    // Extracting deudor data
    const deudor: Deudor = {
        id: prestamoWithDeudor.deudores.id,
        nombre: prestamoWithDeudor.deudores.nombre,
        cedula: prestamoWithDeudor.deudores.cedula,
        ciudad: prestamoWithDeudor.deudores.ciudad,
        telefono: prestamoWithDeudor.deudores.telefono,
        creado_en: prestamoWithDeudor.deudores.creado_en
    };

    // Mapping cuotas
    const tablaAmortizacion: Cuota[] = cuotasDB.map(cuota => ({
        id: cuota.id,
        prestamo_id: cuota.prestamo_id,
        numero: cuota.numero,
        fecha_vencimiento: cuota.fecha_vencimiento,
        valor: cuota.valor,
        interes: cuota.interes,
        abono_capital: cuota.abono_capital,
        estado: cuota.estado,
        pagado_en: cuota.pagado_en || undefined,
        // Preservar campos derivados si vienen desde selects con join (pagos/abonos)
        valor_pagado_real: (cuota as any).valor_pagado_real ?? null,
        fecha_pago_real: (cuota as any).fecha_pago_real ?? null,
        observacion_pago: (cuota as any).observacion_pago ?? null,
        abono_adicional: (cuota as any).abono_adicional ?? null,
        observacion_abono: (cuota as any).observacion_abono ?? null,
        total_pagado: (cuota as any).total_pagado ?? null
    }));

    // Calculo de cuotas pagadas
    const cuotasPagadas = cuotasDB.filter(cuota => cuota.estado === 'pagada').length;

    // Calcular ganancia total (suma de intereses)
    const gananciaTotal = tablaAmortizacion.reduce((total, cuota) => total + cuota.interes, 0);

    // Calcular monto total a pagar
    const totalPagado = prestamoWithDeudor.monto + gananciaTotal;

    return {
        id: prestamoWithDeudor.id,
        deudor,
        deudor_id: prestamoWithDeudor.deudor_id,
        monto: prestamoWithDeudor.monto,
        tasa_mensual: prestamoWithDeudor.tasa_mensual,
        cuotas: prestamoWithDeudor.cuotas,
        cuota_mensual: prestamoWithDeudor.cuota_mensual,
        fecha_inicio: prestamoWithDeudor.fecha_inicio,
        estado: prestamoWithDeudor.estado,
        observaciones: prestamoWithDeudor.observaciones,
        creado_en: prestamoWithDeudor.creado_en,
        cuotasPagadas,
        tablaAmortizacion,
        gananciaTotal,
        totalPagado
    };
}

// Función temporal para asociar usuario cliente con deudor existente
export async function asociarUsuarioClienteConDeudor(): Promise<boolean> {

    try {
        // 1. Hacer login como usuario cliente
        const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'andres.barretos24@gmail.com',
            password: '123456' // Asumiendo que esta es la contraseña
        });

        if (loginError || !user) {
            console.error('Error en login:', loginError?.message || 'Usuario no encontrado');
            return false;
        }


        // 2. Obtener el deudor existente (Omar German Barreto Guerrero)
        const { data: deudor, error: deudorError } = await supabase
            .from('deudores')
            .select('*')
            .eq('nombre', 'Omar German Barreto Guerrero')
            .single();

        if (deudorError || !deudor) {
            console.error('Error obteniendo deudor:', deudorError?.message);
            return false;
        }


        // 3. Actualizar el deudor con el user_id del cliente
        const { error: updateError } = await supabase
            .from('deudores')
            .update({ user_id: user.id })
            .eq('id', deudor.id);

        if (updateError) {
            console.error('Error actualizando deudor:', updateError.message);
            return false;
        }


        return true;

    } catch (error) {
        console.error('Error en asociarUsuarioClienteConDeudor:', error);
        return false;
    }
} 