/**
 * Componentes del sistema de diseño Fisterra.
 *
 * Toda pantalla de FSTrack se arma con estas piezas; no volver a escribir
 * paneles, cajas de estado ni inputs a mano en los archivos de pantalla.
 */
export { Button, SecondaryButton, type ButtonProps, type ButtonVariant } from './button';
export { Field, type FieldProps } from './field';
export {
  FormScreen,
  FormSection,
  ItemCard,
  ItemGroup,
  type FormScreenProps,
  type ItemCardProps,
} from './form-layout';
export { PairedHeading, type PairedHeadingProps } from './heading';
export { Isotipo, Lockup, type LockupProps } from './logo';
export { NavCard, type NavCardProps } from './nav-card';
export { Chip, Pill, Tab, type PillProps, type TabProps } from './pill';
export {
  StatusBadge,
  StatusBox,
  type StatusBoxProps,
  type StatusVariant,
} from './status-box';
export { Card, Panel, Screen, type ScreenProps } from './surfaces';
