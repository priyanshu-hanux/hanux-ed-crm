
"use client";

import * as React from "react";
import { appIcons } from "@/configs/icons";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export type SearchScope = "crm" | "web" | "both";

export type SearchQuery = {
  text: string;
  files: File[];
  scope: SearchScope;
};

type AttachedFile = {
  id: string;
  file: File;
};

type AISearchInputProps = {
  onSubmitQuery: (query: SearchQuery) => void | Promise<void>;
  initialPrompt?: string;
  isLoading?: boolean;
  onTextChange?: (text: string) => void;
};

const scopeLabels: Record<SearchScope, string> = {
  crm: "CRM only",
  web: "Web only",
  both: "CRM + Web",
};

export function AISearchInput({
  onSubmitQuery,
  initialPrompt = "",
  isLoading = false,
  onTextChange,
}: AISearchInputProps) {
  const [text, setText] = React.useState(initialPrompt);
  const [files, setFiles] = React.useState<AttachedFile[]>([]);
  const [scope, setScope] = React.useState<SearchScope>("both");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canSend = text.trim().length > 0 && !isLoading;

  React.useEffect(() => {
    setText(initialPrompt);
  }, [initialPrompt]);

  function updateText(value: string) {
    setText(value);
    onTextChange?.(value);
    setSubmitError(null);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query = text.trim();

    if (!query || isLoading) return;

    setSubmitError(null);

    try {
      await onSubmitQuery({
        text: query,
        files: files.map(({ file }) => file),
        scope,
      });

      setText("");
      setFiles([]);
      onTextChange?.("");
    } catch (error) {
      console.error("Failed to submit search query:", error);
      setSubmitError("Unable to submit your query. Please try again.");
    }
  }

  function handleAttach(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;

    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));

    setFiles((current) => [...current, ...newFiles]);
    event.target.value = "";
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form ref={formRef} onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={handleAttach}
        />

        <InputGroup className="rounded-2xl border bg-background shadow-sm transition-shadow focus-within:ring-1 focus-within:ring-ring">
          {files.length > 0 && (
            <InputGroupAddon
              align="block-start"
              className="flex-wrap gap-2 px-3 pt-3"
            >
              {files.map(({ id, file }) => (
                <Attachment key={id} size="sm">
                  <AttachmentMedia>
                    <appIcons.file />
                  </AttachmentMedia>

                  <AttachmentContent>
                    <AttachmentTitle>{file.name}</AttachmentTitle>
                  </AttachmentContent>

                  <AttachmentActions>
                    <AttachmentAction
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      disabled={isLoading}
                      onClick={() => removeFile(id)}
                    >
                      <appIcons.close />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </InputGroupAddon>
          )}

          <InputGroupTextarea
            ref={inputRef}
            value={text}
            onChange={(event) => updateText(event.target.value)}
            placeholder="Ask about CRM data, find leads, or research the web..."
            disabled={isLoading}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            className="min-h-28 max-h-52 resize-none overflow-y-auto border-0 px-4 py-4 shadow-none focus-visible:ring-0"
          />

          <InputGroupAddon
            align="block-end"
            className="gap-2 px-3 pb-3"
          >
            <InputGroupButton
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              aria-label="Attach files"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              <appIcons.add />
            </InputGroupButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  aria-label={`Search scope: ${scopeLabels[scope]}`}
                  disabled={isLoading}
                >
                  {scopeLabels[scope]}
                  <appIcons.chevronsDown />
                </InputGroupButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuRadioGroup
                  value={scope}
                  onValueChange={(value) =>
                    setScope(value as SearchScope)
                  }
                >
                  <DropdownMenuRadioItem value="crm">
                    CRM only
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem value="web">
                    Web only
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem value="both">
                    CRM + Web
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <InputGroupButton
              type="submit"
              size="sm"
              variant="default"
              className="ml-auto rounded-full"
              disabled={!canSend}
              aria-label={isLoading ? "Searching" : "Send"}
            >
              {isLoading ? (
                <appIcons.loaderCircle className="animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  Send
                  <appIcons.submit />
                </span>
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {submitError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {submitError}
          </p>
        )}
      </form>
    </div>
  );
}
