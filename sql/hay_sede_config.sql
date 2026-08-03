alter table public.sis_configuracion
  add column if not exists hay_sede boolean not null default true;

comment on column public.sis_configuracion.hay_sede is
  'Si es true, se muestra la pestaña Sede en gestión de datos. Solo configurable por SUPER.';

alter table public.sis_configuracion
  add column if not exists hay_empleados boolean not null default false;

comment on column public.sis_configuracion.hay_empleados is
  'Si es true, se muestra la pestaña Empleados en gestión de datos. Solo configurable por SUPER.';
