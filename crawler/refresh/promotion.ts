import { promises as fs } from 'node:fs';

export interface PromotionArtifact {
  stage: string;
  target: string;
  backup: string;
  recursive?: boolean;
}

export interface PromotionFileSystem {
  rename(from: string, to: string): Promise<void>;
  rm(target: string, options: { recursive?: boolean; force: true }): Promise<void>;
}

const exists = async (target: string): Promise<boolean> => {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
};

export async function promoteArtifacts(
  artifacts: PromotionArtifact[],
  fileSystem: PromotionFileSystem = fs,
): Promise<void> {
  const remove = (artifact: PromotionArtifact, target: string) =>
    fileSystem.rm(target, {
      ...(artifact.recursive ? { recursive: true } : {}),
      force: true,
    });
  const backedUp: PromotionArtifact[] = [];
  const installed: PromotionArtifact[] = [];
  try {
    for (const artifact of artifacts) {
      await remove(artifact, artifact.backup);
      if (await exists(artifact.target)) {
        await fileSystem.rename(artifact.target, artifact.backup);
        backedUp.push(artifact);
      }
    }
    for (const artifact of artifacts) {
      await fileSystem.rename(artifact.stage, artifact.target);
      installed.push(artifact);
    }
  } catch (cause) {
    const rollbackErrors: unknown[] = [];
    for (const artifact of [...installed].reverse()) {
      try {
        await remove(artifact, artifact.target);
      } catch (error) {
        rollbackErrors.push(error);
      }
    }
    for (const artifact of [...backedUp].reverse()) {
      try {
        await fileSystem.rename(artifact.backup, artifact.target);
      } catch (error) {
        rollbackErrors.push(error);
      }
    }
    for (const artifact of artifacts) {
      try {
        await remove(artifact, artifact.stage);
      } catch (error) {
        rollbackErrors.push(error);
      }
    }
    if (rollbackErrors.length)
      throw new AggregateError(
        [cause, ...rollbackErrors],
        'promotion failed and rollback was incomplete',
      );
    throw cause;
  }
  for (const artifact of backedUp) await remove(artifact, artifact.backup);
}
