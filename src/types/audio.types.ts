/**
 * @module audio.types
 * Audio system type definitions for Chromatica v2.
 */

/** Named sound-effect events that can be triggered during gameplay. */
export type SFXEvent =
  | 'pour'
  | 'success'
  | 'failure'
  | 'clientArriveWizard'
  | 'clientArriveZombie'
  | 'clientArriveVillager'
  | 'uiClick'
  | 'uiHover'
  | 'comboMilestone'
  | 'waveClear'
  | 'timeout'
  | 'achievementUnlock';

/** Background music mood states. */
export type BGMState = 'ambient' | 'driving' | 'tension' | 'silent';

/** User-configurable audio settings. */
export interface AudioSettings {
  masterVolume: number; // 0-1
  bgmVolume: number;    // 0-1
  sfxVolume: number;    // 0-1
  muted: boolean;
}
