import type { Afiliado, Lider } from './esquemas';
import { toast } from '@/lib/toast';
import { deleteUserAccountAction } from '@/app/actions/usuarios';
import { deleteAfiliadoAction } from '@/app/actions/afiliados';
import { swalConfirmarEliminacion } from '@/lib/swalTheme';

export const eliminar = async (registro: Afiliado | Lider, onEliminado: () => void) => {
    const nombreCompleto = `${registro.nombres} ${registro.apellidos}`;
    const esLider = 'email' in registro;

    const confirmacion = await swalConfirmarEliminacion(nombreCompleto);

    if (confirmacion.isConfirmed) {
        let mensajeError: string | undefined = undefined;

        if (esLider) {
            const result = await deleteUserAccountAction(registro.id);
            if (result.error) {
                mensajeError = result.error;
            }
        } else {
            const result = await deleteAfiliadoAction(registro.id);

            if (result.error) {
                mensajeError = result.error.message;
            }
        }

        if (mensajeError) {
            toast.error('No se pudo eliminar el registro.');
            console.error('Error de eliminación:', mensajeError);
        } else {
            toast.success(`"${nombreCompleto}" ha sido eliminado.`);
            onEliminado();
        }
    }
};
