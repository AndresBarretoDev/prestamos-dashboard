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
import { DownloadIcon, Loader2 } from "lucide-react"
import { format, addMonths } from "date-fns"
import { es } from "date-fns/locale"
import { configuracion } from "@/lib/config"
import { exportToPDF, generatePagareFilename } from "@/lib/utils/pdf-export"
import { useRef, useState } from "react"
import { toast } from "sonner"

interface GenerarDocumentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestamo: Prestamo
}

export function GenerarDocumentoDialog({ open, onOpenChange, prestamo }: GenerarDocumentoDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  const fechaActual = format(new Date(), "dd/MM/yyyy")

  // Calcular la fecha de vencimiento sumando el número de cuotas a la fecha de inicio
  // Usar la misma lógica que en la tabla de amortización para evitar diferencias
  const [year, month, day] = prestamo.fecha_inicio.split('-').map(Number)
  const fechaInicio = new Date(year, month - 1, day) // month - 1 porque Date usa índices basados en 0 para meses

  const fechaVencimiento = format(addMonths(fechaInicio, prestamo.cuotas), "dd/MM/yyyy", { locale: es })

  // Fecha de la primera cuota (un mes después de la fecha de inicio)
  const fechaPrimeraCuota = format(addMonths(fechaInicio, 1), "dd/MM/yyyy", { locale: es })

  // Formatear la fecha de inicio para mostrarla
  const fechaInicioFormateada = format(fechaInicio, "dd/MM/yyyy", { locale: es })

  // Convertir el monto a texto
  const montoEnLetras = convertirNumeroALetras(prestamo.monto)

  const handleExportPDF = async () => {
    if (!documentRef.current) {
      toast.error("Error al generar el PDF")
      return
    }

    setIsExporting(true)

    try {
      const filename = generatePagareFilename(prestamo.id, prestamo.deudor.nombre)
      await exportToPDF({
        element: documentRef.current,
        filename,
        format: 'a4',
        orientation: 'portrait'
      })

      toast.success("PDF exportado exitosamente")
    } catch (error) {
      console.error("Error al exportar PDF:", error)
      toast.error("Error al generar el PDF. Por favor, intenta nuevamente.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documento de préstamo</DialogTitle>
          <DialogDescription>Vista previa del pagaré generado para este préstamo.</DialogDescription>
        </DialogHeader>

        <div ref={documentRef} className="p-8 bg-white text-black max-w-[800px] mx-auto" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', fontSize: '14px' }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold uppercase mb-2">PAGARÉ</h2>
            <p className="text-lg">No. {prestamo.id}</p>
          </div>

          <div className="space-y-6">
            <p>
              <span className="font-bold">VALOR:</span> {formatCurrency(prestamo.monto)}
            </p>

            <p>
              <span className="font-bold">FECHA DE VENCIMIENTO:</span>{" "}
              {fechaVencimiento}
            </p>

            <p className="text-justify leading-relaxed">
              Yo, <strong>{prestamo.deudor.nombre}</strong>, mayor de edad, identificado con cédula de
              ciudadanía No. <strong>{prestamo.deudor.cedula}</strong>, me obligo a pagar incondicionalmente,
              a la orden de <strong>{configuracion.representanteLegal.nombre}</strong>, identificado con cédula de
              ciudadanía No. <strong>{configuracion.representanteLegal.cedula}</strong>, en la ciudad de{" "}
              <strong>{prestamo.deudor.ciudad || configuracion.empresa.ciudad}</strong>, la suma de{" "}
              <strong>{formatCurrency(prestamo.monto)}</strong> ({montoEnLetras}),
              más los intereses señalados en el presente documento.
            </p>

            <p className="text-justify leading-relaxed">
              Me comprometo a pagar la suma mencionada en <strong>{convertirCuotasAPalabras(prestamo.cuotas)} ({prestamo.cuotas})</strong> cuotas
              mensuales de <strong>{formatCurrency(prestamo.cuota_mensual)}</strong> cada una, con
              vencimiento el mismo día de cada mes, siendo la primera cuota pagadera el día{" "}
              <strong>{fechaPrimeraCuota}</strong>.
            </p>

            <p className="text-justify leading-relaxed">
              La tasa de interés pactada es del <strong>{prestamo.tasa_mensual}%</strong> mensual sobre
              saldos.
            </p>

            <p className="text-justify leading-relaxed">
              En caso de mora, me obligo a pagar intereses moratorios a la tasa máxima legal permitida, sin perjuicio de las
              acciones legales que el acreedor pueda iniciar para el cobro de la obligación.
            </p>

            <p className="text-justify leading-relaxed">
              Asimismo, autorizo de manera expresa a <strong>{configuracion.representanteLegal.nombre}</strong> para reportar, procesar, solicitar y divulgar a las centrales de riesgo financiero
              toda la información relacionada con mi comportamiento como deudor.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-12">
              <div>
                <p className="mb-6 font-semibold">Firma del Deudor:</p>
                <div className="border-b-2 border-black h-12 mb-4"></div>
                <div className="text-sm">
                  <p className="font-bold">{prestamo.deudor.nombre}</p>
                  <p>CC: {prestamo.deudor.cedula}</p>
                  <p>Tel: {prestamo.deudor.telefono}</p>
                </div>
              </div>

              <div>
                <p className="mb-6 font-semibold">Firma del Acreedor:</p>
                <div className="border-b-2 border-black h-12 mb-4"></div>
                <div className="text-sm">
                  <p className="font-bold">{configuracion.representanteLegal.nombre}</p>
                  <p>CC: {configuracion.representanteLegal.cedula}</p>
                  <p>{configuracion.representanteLegal.cargo}</p>
                  <p>Fecha: {fechaActual}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Función auxiliar para convertir el número de cuotas a palabras
function convertirCuotasAPalabras(numero: number): string {
  const numeros = [
    '', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
    'veintiuna', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta',
    'treinta y una', 'treinta y dos', 'treinta y tres', 'treinta y cuatro', 'treinta y cinco', 'treinta y seis', 'treinta y siete', 'treinta y ocho', 'treinta y nueve', 'cuarenta',
    'cuarenta y una', 'cuarenta y dos', 'cuarenta y tres', 'cuarenta y cuatro', 'cuarenta y cinco', 'cuarenta y seis', 'cuarenta y siete', 'cuarenta y ocho'
  ]

  if (numero <= 48) {
    return numeros[numero]
  }
  return numero.toString() // Para números mayores a 48, usar el número
}

// Función auxiliar para convertir números a letras (implementación mejorada)
function convertirNumeroALetras(numero: number): string {
  if (numero === 0) return "cero pesos colombianos";

  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenasEspeciales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  // Función auxiliar para convertir números menores a 1000
  function convertirMenos1000(n: number): string {
    if (n === 0) return '';
    if (n === 1) return 'uno';
    if (n === 100) return 'cien';

    const centena = Math.floor(n / 100);
    const decena = Math.floor((n % 100) / 10);
    const unidad = n % 10;

    let resultado = '';

    if (centena > 0) {
      resultado += centenas[centena] + ' ';
    }

    if (decena === 1 && unidad > 0) {
      resultado += decenasEspeciales[unidad] + ' ';
    } else {
      if (decena > 0) {
        resultado += decenas[decena];
        if (unidad > 0) {
          if (decena === 2) {
            resultado = 'veinti' + unidades[unidad].toLowerCase();
          } else {
            resultado += ' y ' + unidades[unidad].toLowerCase();
          }
        }
      } else if (unidad > 0) {
        resultado += unidades[unidad].toLowerCase();
      }
    }

    return resultado.trim();
  }

  // Descomponer el número en sus partes
  const millones = Math.floor(numero / 1000000);
  const miles = Math.floor((numero % 1000000) / 1000);
  const resto = numero % 1000;

  let resultado = '';

  // Millones
  if (millones === 1) {
    resultado += 'un millón ';
  } else if (millones > 1) {
    resultado += convertirMenos1000(millones) + ' millones ';
  }

  // Miles
  if (miles === 1) {
    resultado += 'mil ';
  } else if (miles > 1) {
    resultado += convertirMenos1000(miles) + ' mil ';
  }

  // Resto
  if (resto > 0 || (millones === 0 && miles === 0)) {
    resultado += convertirMenos1000(resto);
  }

  // Quitar el "uno" si está al final para corrección gramatical
  if (resultado.endsWith('uno')) {
    resultado = resultado.slice(0, -3) + 'un';
  }

  return resultado.trim() + ' pesos colombianos';
}
