import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from '@tiptap/extension-image';

async function getIsMailgunConfigured() {
  const response = await fetch("/api/email");
  return await response;
}

export default function Email() {
  const { address: injectedAddress } = useAccount();
  const [hasCheckedEmailBackendConfigured, setHasCheckedEmailBackendConfigured] = useState<boolean>(false);

  const [canUseEditor, setCanUseEditor] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [sendEmailResponse, setSendEmailResponse] = useState<string>("");

  const [htmlEmailBody, setHtmlEmailBody] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [signedMessage, setSignedMessage] = useState<string>("");

  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message,
    onSettled(data, error) {
      setSignedMessage(message);
      setMessage("");
    },
    onMutate(args) {
      if(message === "") {
        throw new Error("Message is blank. Cannot sign a blank message.")
      }
    },
  });

  useEffect(() => {
    if(hasCheckedEmailBackendConfigured) {
      return;
    }

    // Now save the address
    const isMailgunConfigured = async () => {
      const res = await getIsMailgunConfigured();
      setHasCheckedEmailBackendConfigured(true);
      return res;
    };

    isMailgunConfigured()
      .then((res) => setCanUseEditor(res.status === 200))
      .catch(() => setCanUseEditor(false));
  }, [hasCheckedEmailBackendConfigured]);

  useEffect(() => {
    if (message !== "" || signedMessage !== message) {
      try {
        signMessage();
      } catch(e) {
        console.log(e);
      }
    }

    if (isSuccess) {
      const payload = {
        data: {
          text: signedMessage,
          html: htmlEmailBody,
        },
        proof: data,
        address: injectedAddress,
      };

      // Now save the address
      const didEmailSend = async () => {
        const res = await sendEmail(payload);
        return res;
      };

      didEmailSend()
        .then((resp: any) => setSendEmailResponse(resp.message ?? `Sent`))
        .catch((resp) => setSendEmailResponse(resp.message ?? `An error occured`));
    }
  }, [message, isSuccess]);

  async function sendEmail(payload: any) {
    setIsSendingEmail(true);
    setSendEmailResponse("");

    const response = await fetch("/api/email/send", {
      method: "POST",
      body: JSON.stringify(payload),
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
      Image
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

  const addImage = useCallback(() => {
    const url = window.prompt('URL')

    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

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
      <button
        onClick={addImage}
        className={editor?.isActive("link") ? "is-active" : ""}
      >
        Add Image
      </button>

      <EditorContent editor={editor} />

      <button
        type="submit"
        disabled={isSendingEmail}
        onClick={() => {
          setHtmlEmailBody(editor!.getHTML());
          setMessage(editor!.getText());
        }}
      >
        Send Email
      </button>
      <div>{sendEmailResponse}</div>
    </>
  );
}