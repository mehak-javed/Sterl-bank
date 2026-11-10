import { getRoundUpSetting } from "@/server/queries";
import { SkeletonRows } from "./QueryStates";
import { RoundUpToggle } from "./RoundUpToggle";

/** Server wrapper: reads the saved setting, passes it to the interactive switch. */
export async function RoundUpSetting() {
  const enabled = await getRoundUpSetting();
  return <RoundUpToggle enabled={enabled} />;
}

export function RoundUpSettingSkeleton() {
  return (
    <section aria-busy="true" aria-label="Round-ups" className="glass rounded-3xl p-5">
      <p className="mb-3 text-lg font-semibold text-heading">Round-ups</p>
      <SkeletonRows rows={2} />
    </section>
  );
}
