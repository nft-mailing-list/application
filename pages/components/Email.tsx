import { useState, useEffect, useCallback } from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";

async function getIsMailgunConfigured() {
  const response = await fetch("/api/email");
  return await response;
}

export default function Email() {
  const [canUseEditor, setCanUseEditor] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [sendEmailResponse, setSendEmailResponse] = useState<string>("");

  useEffect(() => {
      // Now save the address
      const isMailgunConfigured = async () => {
        const res = await getIsMailgunConfigured();
        return res;
      };

      isMailgunConfigured()
        .then((res) => setCanUseEditor(res.status === 200))
        .catch(() => setCanUseEditor(false));
  });

  async function sendEmail(text: string, html: string) {
    setIsSendingEmail(true);
    setSendEmailResponse("");

    const response = await fetch("/api/email/send", {
      method: "POST",
      body: JSON.stringify({
        text,
        html
      })
    });
    
    const res = await response.json();
    setIsSendingEmail(false);
    setSendEmailResponse(res.message);
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Paragraph,
      Text,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    editorProps: {
      attributes: {
        class: "draft-email-editor",
      },
    },
    content: "",
  });

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if(!canUseEditor) {
    return(
      <>
        Mailgun is not configured, you cannot send an email from this application.
      </>
    )
  }

  return (
    <>
      <button
        onClick={() =>
          editor!.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        H1
      </button>
      <button
        onClick={() =>
          editor!.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </button>
      <button
        onClick={() =>
          editor!.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        H3
      </button>
      <button onClick={() => editor!.chain().focus().toggleBold().run()}>
        B
      </button>
      <button
        onClick={setLink}
        className={editor?.isActive("link") ? "is-active" : ""}
      >
        Add Link
      </button>
      <button
        onClick={() => editor!.chain().focus().unsetLink().run()}
        disabled={!editor?.isActive("link")}
      >
        Remove Link
      </button>

      <EditorContent editor={editor} />

      <button disabled={isSendingEmail} onClick={async () => await sendEmail(editor!.getText(), editor!.getHTML())}>Send Email</button>
      <div>{sendEmailResponse}</div>
    </>
  );
}
