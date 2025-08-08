"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save } from "lucide-react"
import { configuracion } from "@/lib/config"
import { toast } from "sonner"

interface ConfiguracionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ConfiguracionDialog({ open, onOpenChange }: ConfiguracionDialogProps) {
    const [formData, setFormData] = useState({
        nombre: configuracion.representanteLegal.nombre,
        cedula: configuracion.representanteLegal.cedula,
        cargo: configuracion.representanteLegal.cargo,
        empresaNombre: configuracion.empresa.nombre,
        empresaCiudad: configuracion.empresa.ciudad,
    })

    const handleSave = () => {
        // En una implementación real, aquí guardarías la configuración en una base de datos
        // o en localStorage. Por simplicidad, solo mostramos un mensaje
        toast.success("Configuración actualizada (solo en esta sesión)")
        onOpenChange(false)
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configuración del Sistema
                    </DialogTitle>
                    <DialogDescription>
                        Configura la información del representante legal que aparecerá en los pagarés.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Representante Legal</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange("nombre", e.target.value)}
                            placeholder="Tu nombre completo"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cedula">Número de Cédula</Label>
                        <Input
                            id="cedula"
                            value={formData.cedula}
                            onChange={(e) => handleInputChange("cedula", e.target.value)}
                            placeholder="1234567890"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input
                            id="cargo"
                            value={formData.cargo}
                            onChange={(e) => handleInputChange("cargo", e.target.value)}
                            placeholder="Representante Legal"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="empresaNombre">Nombre de la Empresa</Label>
                        <Input
                            id="empresaNombre"
                            value={formData.empresaNombre}
                            onChange={(e) => handleInputChange("empresaNombre", e.target.value)}
                            placeholder="Financiera Personal"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="empresaCiudad">Ciudad</Label>
                        <Input
                            id="empresaCiudad"
                            value={formData.empresaCiudad}
                            onChange={(e) => handleInputChange("empresaCiudad", e.target.value)}
                            placeholder="Bogotá"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Configuración
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 