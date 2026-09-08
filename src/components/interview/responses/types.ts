import type {
  QuestionOfType,
  ResponseMethod,
  ResponseType,
  ResponseValue,
} from "@/types/interview";

/**
 * Contract every response component implements. The engine hands over the
 * question config and current value; the component reports a new value and
 * how it was produced. Components never read or write interview state.
 */
export interface ResponseComponentProps<T extends ResponseType = ResponseType> {
  question: QuestionOfType<T>;
  value: ResponseValue | null;
  onChange: (value: ResponseValue | null, method: ResponseMethod) => void;
  /** Id of the visible prompt element, for aria-labelledby. */
  labelId: string;
  /** Id of the description element, if any, for aria-describedby. */
  describedById?: string;
}
