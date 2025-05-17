import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Prestamo, Deudor, Cuota } from '@/lib/types';
import { addMonths, format } from 'date-fns';
import { calcularCuotaMensual, calcularTablaAmortizacion } from '@/lib/calculadora';
import { formatCurrency } from '@/lib/utils';

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

    // Para cada préstamo, obtenemos sus cuotas
    const prestamosWithCuotas = await Promise.all(
        prestamosData.map(async (prestamoWithDeudor) => {
            const { data: cuotasData, error: cuotasError } = await supabase
                .from('cuotas')
                .select('*')
                .eq('prestamo_id', prestamoWithDeudor.id)
                .order('numero', { ascending: true });

            if (cuotasError) {
                console.error('Error fetching cuotas:', cuotasError);
                return mapPrestamoDBToModel(prestamoWithDeudor, []);
            }

            return mapPrestamoDBToModel(prestamoWithDeudor, cuotasData || []);
        })
    );

    return prestamosWithCuotas;
}

// Función para obtener un préstamo por su ID
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

    const { data: cuotasData, error: cuotasError } = await supabase
        .from('cuotas')
        .select('*')
        .eq('prestamo_id', id)
        .order('numero', { ascending: true });

    if (cuotasError) {
        console.error('Error fetching cuotas:', cuotasError);
        return mapPrestamoDBToModel(data, []);
    }

    return mapPrestamoDBToModel(data, cuotasData || []);
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
        .single();

    // Si hay un error diferente a 'no se encontró registro', retornamos null
    if (deudorError && deudorError.code !== 'PGRST116') {
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
        // Calcular la fecha de vencimiento para cada cuota
        const fechaInicio = new Date(formData.fecha_inicio);
        const fechaVencimiento = addMonths(fechaInicio, cuota.numero);

        return {
            prestamo_id: nuevoPrestamo.id,
            numero: cuota.numero,
            fecha_vencimiento: format(fechaVencimiento, 'yyyy-MM-dd'),
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
    // Obtener el préstamo actual
    const prestamo = await getPrestamo(prestamoId);
    if (!prestamo) return null;

    // Validar que el monto no exceda el saldo pendiente
    const saldoPendiente = prestamo.tablaAmortizacion
        .filter(cuota => cuota.estado === 'pendiente')
        .reduce((sum, cuota) => sum + cuota.abono_capital, 0);

    if (data.monto > saldoPendiente) {
        throw new Error('El monto del abono excede el saldo pendiente del préstamo');
    }

    // Registrar el abono
    const { error: abonoError } = await supabase
        .from('abonos_capital')
        .insert({
            prestamo_id: prestamoId,
            monto: data.monto,
            fecha_abono: data.fecha_abono,
            observaciones: data.observaciones,
            tipo_recalculo: data.tipo_recalculo
        });

    if (abonoError) {
        console.error('Error registering abono:', abonoError);
        return null;
    }

    // Recalcular el préstamo
    const nuevoSaldo = saldoPendiente - data.monto;
    const cuotasPagadas = prestamo.tablaAmortizacion.filter(cuota => cuota.estado === 'pagada').length;
    const cuotasRestantes = prestamo.tablaAmortizacion.filter(cuota => cuota.estado === 'pendiente').length;

    // Guardar las fechas de vencimiento originales para mantenerlas
    const cuotasPendientesOriginales = prestamo.tablaAmortizacion
        .filter(cuota => cuota.estado === 'pendiente')
        .sort((a, b) => a.numero - b.numero);

    let nuevaTablaAmortizacion: Cuota[];
    let nuevaCantidadCuotas: number;
    let nuevaCuotaMensual: number;

    if (data.tipo_recalculo === 'reducir_cuota') {
        // Recalcular cuota manteniendo el plazo
        const nuevaCuota = calcularCuotaMensual(nuevoSaldo, prestamo.tasa_mensual, cuotasRestantes);
        nuevaTablaAmortizacion = calcularTablaAmortizacion(
            nuevoSaldo,
            prestamo.tasa_mensual,
            cuotasRestantes,
            nuevaCuota,
            prestamo.fecha_inicio
        );
        nuevaCantidadCuotas = cuotasPagadas + cuotasRestantes;
        nuevaCuotaMensual = nuevaCuota;
    } else {
        // Recalcular plazo manteniendo la cuota
        const nuevaCuota = prestamo.cuota_mensual;
        // Verificar que el monto restante sea suficiente para ser pagado con la cuota actual
        if (nuevaCuota <= (nuevoSaldo * prestamo.tasa_mensual)) {
            throw new Error('La cuota actual es demasiado baja para cubrir el saldo restante. Elija reducir cuota en su lugar.');
        }

        const nuevoPlazo = Math.max(1, Math.ceil(
            Math.log(nuevaCuota / (nuevaCuota - nuevoSaldo * prestamo.tasa_mensual)) /
            Math.log(1 + prestamo.tasa_mensual)
        ));

        nuevaTablaAmortizacion = calcularTablaAmortizacion(
            nuevoSaldo,
            prestamo.tasa_mensual,
            nuevoPlazo,
            nuevaCuota,
            prestamo.fecha_inicio
        );
        nuevaCantidadCuotas = cuotasPagadas + nuevoPlazo;
        nuevaCuotaMensual = nuevaCuota;
    }

    // Verificar que haya cuotas calculadas
    if (!nuevaTablaAmortizacion || nuevaTablaAmortizacion.length === 0) {
        throw new Error('No se pudo calcular una nueva tabla de amortización. El saldo pendiente es demasiado bajo.');
    }

    // Actualizar el préstamo con la nueva tabla de amortización
    const { error: updateError } = await supabase
        .from('prestamos')
        .update({
            cuota_mensual: nuevaCuotaMensual,
            cuotas: nuevaCantidadCuotas
        })
        .eq('id', prestamoId);

    if (updateError) {
        console.error('Error updating prestamo:', updateError);
        return null;
    }

    // Eliminar todas las cuotas pendientes antes de insertar las nuevas
    const { error: deleteError } = await supabase
        .from('cuotas')
        .delete()
        .eq('prestamo_id', prestamoId)
        .eq('estado', 'pendiente');

    if (deleteError) {
        console.error('Error deleting existing cuotas:', deleteError);
        return null;
    }

    // Preparar las nuevas cuotas con numeración correcta y preservando las fechas originales
    const cuotasToInsert = nuevaTablaAmortizacion.map((cuota, index) => {
        // Mantener las fechas originales si están disponibles, o usar las nuevas calculadas
        const fechaVencimiento = index < cuotasPendientesOriginales.length
            ? cuotasPendientesOriginales[index].fecha_vencimiento
            : cuota.fecha_vencimiento;

        return {
            prestamo_id: prestamoId,
            numero: cuotasPagadas + index + 1,
            fecha_vencimiento: fechaVencimiento,
            valor: cuota.valor,
            interes: cuota.interes,
            abono_capital: cuota.abono_capital,
            estado: 'pendiente'
        };
    });

    // Insertar las nuevas cuotas
    if (cuotasToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('cuotas')
            .insert(cuotasToInsert);

        if (insertError) {
            console.error('Error inserting new cuotas:', insertError);
            return null;
        }
    }

    return getPrestamo(prestamoId);
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
        // Solo registrar si el excedente es significativo (más de 100 pesos)
        if (excedente >= 100) {
            await registrarAbonoCapital(prestamoId, {
                monto: excedente,
                fecha_abono: fechaPago,
                observaciones: `Excedente del pago de la cuota ${cuotaNumero}`,
                tipo_recalculo: 'reducir_cuota' // Por defecto, reducir la cuota
            });
        }
    }

    // Verificar si todas las cuotas están pagadas
    const { data: cuotasPendientes, error: pendientesError } = await supabase
        .from('cuotas')
        .select('count')
        .eq('prestamo_id', prestamoId)
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
        pagado_en: cuota.pagado_en || undefined
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