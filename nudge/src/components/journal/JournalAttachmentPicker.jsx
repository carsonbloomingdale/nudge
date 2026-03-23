import { useCallback, useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";

const DEFAULT_MAX_FILES = 8;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: ${(p) => (p.$tight ? "0.5rem" : "0.75rem")};
`;

const Label = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: hsl(var(--muted-foreground));
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const AddBtn = styled.button`
  flex: 0 0 auto;
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid hsl(var(--border) / 0.55);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  cursor: pointer;
  background: hsl(var(--card) / 0.85);
  color: hsl(var(--foreground));
  transition: box-shadow 200ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 2px 8px hsl(var(--foreground) / 0.06);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PreviewStrip = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const ThumbWrap = styled.div`
  position: relative;
  flex: 0 0 auto;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.45rem;
  overflow: hidden;
  box-shadow: 0 0 0 1px hsl(var(--border) / 0.45);
`;

const Thumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  width: 1.35rem;
  height: 1.35rem;
  border: none;
  border-radius: 9999px;
  padding: 0;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  background: hsl(var(--background) / 0.85);
  color: hsl(var(--foreground));
  box-shadow: 0 1px 3px hsl(var(--foreground) / 0.2);

  &:hover {
    background: hsl(var(--foreground) / 0.88);
    color: hsl(var(--background));
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
`;

function ThumbPreview({ file }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url ? <Thumb src={url} alt="" /> : null;
}

/**
 * @param {{ files: File[], onFilesChange: (files: File[]) => void, tight?: boolean, maxFiles?: number }} props
 */
export default function JournalAttachmentPicker({
  files,
  onFilesChange,
  tight = false,
  maxFiles = DEFAULT_MAX_FILES,
}) {
  const cap = Math.min(DEFAULT_MAX_FILES, Math.max(0, maxFiles));
  const inputRef = useRef(null);
  const reactId = useId();
  const inputId = `journal-attach-${reactId}`;

  const mergeNewFiles = useCallback(
    (incoming) => {
      if (!incoming?.length) {
        return;
      }
      const next = [...files];
      for (let i = 0; i < incoming.length && next.length < cap; i += 1) {
        const f = incoming[i];
        if (f && typeof f.type === "string" && f.type.startsWith("image/")) {
          next.push(f);
        }
      }
      onFilesChange(next);
    },
    [files, onFilesChange, cap],
  );

  const onInputChange = useCallback(
    (e) => {
      const list = e.target?.files;
      if (!list?.length) {
        return;
      }
      mergeNewFiles(Array.from(list));
      e.target.value = "";
    },
    [mergeNewFiles],
  );

  const removeAt = useCallback(
    (ix) => {
      onFilesChange(files.filter((_, i) => i !== ix));
    },
    [files, onFilesChange],
  );

  return (
    <Row $tight={tight}>
      <Label id={`${inputId}-label`}>Photos (optional)</Label>
      <Actions>
        <HiddenInput
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          aria-labelledby={`${inputId}-label`}
          onChange={onInputChange}
        />
        <AddBtn
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= cap}
        >
          {files.length ? "Add more" : "Add photos"}
        </AddBtn>
      </Actions>
      {files.length > 0 ? (
        <PreviewStrip>
          {files.map((file, ix) => (
            <ThumbWrap key={`${file.name}-${file.size}-${ix}`}>
              <ThumbPreview file={file} />
              <RemoveBtn
                type="button"
                aria-label={`Remove photo ${ix + 1}`}
                onClick={() => removeAt(ix)}
              >
                ×
              </RemoveBtn>
            </ThumbWrap>
          ))}
        </PreviewStrip>
      ) : null}
    </Row>
  );
}
