import accident from "../assets/ai-icons/accident.png";
import citizens from "../assets/ai-icons/citizens.png";
import fire from "../assets/ai-icons/fire.png";
import firefighter from "../assets/ai-icons/firefighter.png";
import medical from "../assets/ai-icons/medical.png";
import rapid from "../assets/ai-icons/rapid.png";
import rescue from "../assets/ai-icons/rescue.png";
import secure from "../assets/ai-icons/secure.png";
import siren from "../assets/ai-icons/siren.png";

const sources = { accident, citizens, fire, firefighter, medical, rapid, rescue, secure, siren };
export type AiIconName = keyof typeof sources;

export function AiIcon({ alt = "", className = "", name }: { alt?: string; className?: string; name: AiIconName }) {
  return <img alt={alt} className={`object-contain ${className}`} src={sources[name]} />;
}
