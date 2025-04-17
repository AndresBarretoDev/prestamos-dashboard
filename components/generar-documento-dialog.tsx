"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { DownloadIcon } from "lucide-react"
import { format, addMonths } from "date-fns"
import { es } from "date-fns/locale"

interface GenerarDocumentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestamo: Prestamo
}

export function GenerarDocumentoDialog({ open, onOpenChange, prestamo }: GenerarDocumentoDialogProps) {
  const fechaActual = format(new Date(), "dd/MM/yyyy")

  // Calcular la fecha de vencimiento sumando el número de cuotas a la fecha de inicio
  const fechaInicio = new Date(prestamo.fecha_inicio)
  const fechaVencimiento = format(addMonths(fechaInicio, prestamo.cuotas), "dd/MM/yyyy", { locale: es })

  // Fecha de la primera cuota (un mes después de la fecha de inicio)
  const fechaPrimeraCuota = format(addMonths(fechaInicio, 1), "dd/MM/yyyy", { locale: es })

  // Formatear la fecha de inicio para mostrarla
  const fechaInicioFormateada = format(fechaInicio, "dd/MM/yyyy", { locale: es })

  // Convertir el monto a texto
  const montoEnLetras = convertirNumeroALetras(prestamo.monto)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documento de préstamo</DialogTitle>
          <DialogDescription>Vista previa del pagaré generado para este préstamo.</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-6 bg-white text-black">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold uppercase">PAGARÉ</h2>
            <p className="text-sm">No. {prestamo.id}</p>
          </div>

          <div className="space-y-4">
            <p>
              <span className="font-bold">VALOR:</span> {formatCurrency(prestamo.monto)}
            </p>

            <p>
              <span className="font-bold">FECHA DE VENCIMIENTO:</span>{" "}
              {fechaVencimiento}
            </p>

            <p className="text-justify">
              Yo, <span className="font-bold">{prestamo.deudor.nombre}</span>, mayor de edad, identificado con cédula de
              ciudadanía No. <span className="font-bold">{prestamo.deudor.cedula}</span>, me obligo a pagar incondicionalmente
              a la orden de <span className="font-bold">Andrés Barreto</span>, en la ciudad de{" "}
              <span className="font-bold">{prestamo.deudor.ciudad || "___________"}</span>, la suma de{" "}
              <span className="font-bold">{formatCurrency(prestamo.monto)}</span>
              ({montoEnLetras}), más los intereses señalados en este documento.
            </p>

            <p className="text-justify">
              Me comprometo a pagar la suma indicada en <span className="font-bold">{prestamo.cuotas}</span> cuotas
              mensuales de <span className="font-bold">{formatCurrency(prestamo.cuota_mensual)}</span> cada una, con
              vencimiento el mismo día de cada mes, siendo la primera cuota pagadera el día{" "}
              <span className="font-bold">{fechaPrimeraCuota}</span>.
            </p>

            <p className="text-justify">
              La tasa de interés pactada es del <span className="font-bold">{prestamo.tasa_mensual}%</span> mensual sobre
              saldos.
            </p>

            <p className="text-justify">
              En caso de mora, pagaré intereses moratorios a la tasa máxima legal permitida, sin perjuicio de las
              acciones legales que el acreedor pueda adelantar para el cobro de la obligación.
            </p>

            <p className="text-justify">
              Autorizo a Andrés Barreto para reportar, procesar, solicitar y divulgar a las centrales de riesgo financiero
              toda la información referente a mi comportamiento como deudor.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="mb-4">Firma del Deudor:</p>
                <div className="border-b border-black h-8"></div>
                <p className="mt-2">
                  <span className="font-bold">{prestamo.deudor.nombre}</span>
                  <br />
                  CC: {prestamo.deudor.cedula}
                  <br />
                  Tel: {prestamo.deudor.telefono}
                </p>
              </div>

              <div>
                <p className="mb-4">Firma del Acreedor:</p>
                <div className="border-b border-black h-8"></div>
                <p className="mt-2">
                  <span className="font-bold">Andrés Barreto</span>
                  <br />
                  Representante Legal
                  <br />
                  Fecha: {fechaActual}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Función auxiliar para convertir números a letras (implementación básica)
function convertirNumeroALetras(numero: number): string {
  if (!numero) return "cero pesos";

  // Esta es una implementación básica para números pequeños
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (numero === 0) return "cero pesos";
  if (numero === 1000000) return "un millón de pesos";

  const miles = Math.floor(numero / 1000);
  const centena = Math.floor((numero % 1000) / 100);
  const decena = Math.floor((numero % 100) / 10);
  const unidad = numero % 10;

  let resultado = '';

  if (miles > 0) {
    resultado += miles === 1 ? 'mil ' : unidades[miles] + ' mil ';
  }

  if (centena > 0) {
    resultado += centenas[centena] + ' ';
  }

  if (decena === 1 && unidad !== 0) {
    resultado += especiales[unidad] + ' ';
  } else {
    if (decena > 0) {
      resultado += decenas[decena];
      if (unidad > 0) {
        resultado += ' y ';
      }
    }

    if (unidad > 0 && decena !== 1) {
      resultado += unidades[unidad] + ' ';
    }
  }

  return resultado.trim() + ' pesos';
}
