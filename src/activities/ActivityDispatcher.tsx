import React from 'react';
import type { ActivityId } from '../types/domain';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { Activity01VisualSearch } from './Activity01VisualSearch';
import { Activity02SpotDifference } from './Activity02SpotDifference';
import { Activity03VisualMemory } from './Activity03VisualMemory';
import { Activity04SequenceMemory } from './Activity04SequenceMemory';
import { Activity05OrderSteps } from './Activity05OrderSteps';
import { Activity06SwitchRule } from './Activity06SwitchRule';
import { Activity07MoveFreeze } from './Activity07MoveFreeze';
import { Activity08ListenDo } from './Activity08ListenDo';
import { Activity09WaitSignal } from './Activity09WaitSignal';
import { Activity10CopyAnimal } from './Activity10CopyAnimal';
import { Activity11RealWorldMission } from './Activity11RealWorldMission';
import { Activity12BuildPattern } from './Activity12BuildPattern';
import { Activity13SpeechArticulation } from './Activity13SpeechArticulation';
import { Activity14NarrativeBuilder } from './Activity14NarrativeBuilder';
import { Activity15AuditoryDiscrimination } from './Activity15AuditoryDiscrimination';
import { Activity16ErgoFineMotor } from './Activity16ErgoFineMotor';
import { Activity17SensoryProprioception } from './Activity17SensoryProprioception';
import { Activity18AdlPraxis } from './Activity18AdlPraxis';
import { Activity19EmotionalTheater } from './Activity19EmotionalTheater';
import { Activity20MusicKineticRhythm } from './Activity20MusicKineticRhythm';
import { Activity21TongueGym } from './Activity21TongueGym';
import { Activity22ClearSounds } from './Activity22ClearSounds';
import { Activity23VoiceTheater } from './Activity23VoiceTheater';

interface ActivityDispatcherProps {
  activityId: ActivityId;
  runnerProps: ActivityRunnerRenderProps;
}

export const ActivityDispatcher: React.FC<ActivityDispatcherProps> = ({
  activityId,
  runnerProps,
}) => {
  switch (activityId) {
    case '01-visual-search':
      return <Activity01VisualSearch {...runnerProps} />;
    case '02-spot-difference':
      return <Activity02SpotDifference {...runnerProps} />;
    case '03-visual-memory':
      return <Activity03VisualMemory {...runnerProps} />;
    case '04-sequence-memory':
      return <Activity04SequenceMemory {...runnerProps} />;
    case '05-order-steps':
      return <Activity05OrderSteps {...runnerProps} />;
    case '06-switch-rule':
      return <Activity06SwitchRule {...runnerProps} />;
    case '07-move-freeze':
      return <Activity07MoveFreeze {...runnerProps} />;
    case '08-listen-do':
      return <Activity08ListenDo {...runnerProps} />;
    case '09-wait-signal':
      return <Activity09WaitSignal {...runnerProps} />;
    case '10-copy-animal':
      return <Activity10CopyAnimal {...runnerProps} />;
    case '11-real-world-mission':
      return <Activity11RealWorldMission {...runnerProps} />;
    case '12-build-pattern':
      return <Activity12BuildPattern {...runnerProps} />;
    case '13-speech-articulation':
      return <Activity13SpeechArticulation {...runnerProps} />;
    case '14-narrative-builder':
      return <Activity14NarrativeBuilder {...runnerProps} />;
    case '15-auditory-discrimination':
      return <Activity15AuditoryDiscrimination {...runnerProps} />;
    case '16-ergo-fine-motor':
      return <Activity16ErgoFineMotor {...runnerProps} />;
    case '17-sensory-proprioception':
      return <Activity17SensoryProprioception {...runnerProps} />;
    case '18-adl-praxis':
      return <Activity18AdlPraxis {...runnerProps} />;
    case '19-emotional-theater':
      return <Activity19EmotionalTheater {...runnerProps} />;
    case '20-music-kinetic-rhythm':
      return <Activity20MusicKineticRhythm {...runnerProps} />;
    case '21-tongue-gym':
      return <Activity21TongueGym {...runnerProps} />;
    case '22-clear-sounds':
      return <Activity22ClearSounds {...runnerProps} />;
    case '23-voice-theater':
      return <Activity23VoiceTheater {...runnerProps} />;
  }
};
