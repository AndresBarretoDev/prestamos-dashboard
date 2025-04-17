import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Prestamo, Deudor, Cuota } from '@/lib/types';
import { addMonths, format } from 'date-fns';

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

// Función para marcar una cuota como pagada
export async function markCuotaPagada(prestamoId: string, cuotaNumero: number, valorPagado?: number): Promise<Prestamo | null> {
    // Primero obtenemos la cuota
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

    // Actualizamos la cuota a estado "pagada"
    const fechaPago = new Date().toISOString().split('T')[0];
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

    // Registramos el pago
    const { error: pagoError } = await supabase
        .from('pagos')
        .insert({
            prestamo_id: prestamoId,
            cuota_id: cuota.id,
            valor_pagado: valorPagado || cuota.valor,
            fecha_pago: fechaPago
        });

    if (pagoError) {
        console.error('Error registering pago:', pagoError);
        // Aquí podríamos revertir el cambio en la cuota si falla el registro del pago
        return null;
    }

    // Verificamos si todas las cuotas están pagadas para actualizar el estado del préstamo
    const { data: cuotasPendientes, error: pendientesError } = await supabase
        .from('cuotas')
        .select('count')
        .eq('prestamo_id', prestamoId)
        .not('estado', 'eq', 'pagada');

    if (pendientesError) {
        console.error('Error counting pending cuotas:', pendientesError);
        return null;
    }

    const cuotasPendientesCount = cuotasPendientes[0]?.count || 0;

    if (cuotasPendientesCount === 0) {
        // Si no hay cuotas pendientes, actualizamos el estado del préstamo a "pagado"
        const { error: prestamoError } = await supabase
            .from('prestamos')
            .update({
                estado: 'pagado'
            })
            .eq('id', prestamoId);

        if (prestamoError) {
            console.error('Error updating prestamo status:', prestamoError);
            return null;
        }
    }

    // Devolvemos el préstamo actualizado
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