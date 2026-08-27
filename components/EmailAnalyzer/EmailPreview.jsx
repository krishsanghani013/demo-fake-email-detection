import React from "react";
import {
  Mail,
  Calendar,
  User,
  UserCheck,
  Paperclip,
  FileCode,
  RotateCcw,
  Users,
  Hash,
} from "lucide-react";
import AuthenticationCard from "@/components/Analysis/AuthenticationCard";
import ThreatIntelCard from "@/components/Analysis/ThreatIntelCard";

/**
 * EmailPreview Component (Dark SOC EML Preview)
 *
 * Displays structured forensic metadata, extracted plain-text body,
 * authentication forensics (SPF/DKIM/DMARC), and threat intelligence evidence.
 *
 * @param {Object} props
 * @param {Object} props.parsedEmail - Parsed email object from parseEmail.
 * @param {Function} props.onReset - Callback to clear the preview and upload a new file.
 */
export default function EmailPreview({ parsedEmail, onReset }) {
  if (!parsedEmail) return null;

  const {
    metadata = {},
    body = {},
    attachments = [],
    authentication,
    identity,
    consistency,
    threatIntel,
    artifacts,
  } = parsedEmail;

  const {
    from = "Unknown",
    to = "Unknown",
    cc = "",
    replyTo = "",
    subject = "No Subject",
    date = "",
    messageId = "",
  } = metadata;

  const bodyText = body.text || "No plain text content available.";

  return (
    <div className="space-y-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <FileCode className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Parsed .EML Forensic Data
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Extracted metadata, authentication & threat intelligence evidence
            </p>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#18181B] px-2.5 py-1 text-xs font-medium text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#F4F4F5] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Upload Different File</span>
          </button>
        )}
      </div>

      {/* Metadata Fields Grid */}
      <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-[#71717A]">Subject:</span>
            <p className="truncate font-medium text-[#F4F4F5]">{subject}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-[#71717A]">From:</span>
            <p className="truncate font-medium text-[#F4F4F5]">{from}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
          <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-[#71717A]">To:</span>
            <p className="truncate font-medium text-[#F4F4F5]">{to}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-[#71717A]">Date:</span>
            <p className="truncate font-medium text-[#F4F4F5]">
              {date || "Unknown Date"}
            </p>
          </div>
        </div>

        {replyTo && (
          <div className="flex items-start gap-2 rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-[#71717A]">Reply-To:</span>
              <p className="truncate font-medium text-[#F4F4F5]">{replyTo}</p>
            </div>
          </div>
        )}

        {cc && (
          <div className="flex items-start gap-2 rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-[#71717A]">Cc:</span>
              <p className="truncate font-medium text-[#F4F4F5]">{cc}</p>
            </div>
          </div>
        )}

        {messageId && (
          <div className="col-span-1 sm:col-span-2 flex items-start gap-2 rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#71717A]" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-[#71717A]">Message-ID:</span>
              <p className="truncate font-mono text-[11px] text-[#A1A1AA]">
                {messageId}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Email Authentication & Sender Consistency Section */}
      {authentication && (
        <AuthenticationCard
          authentication={authentication}
          identity={identity}
          consistency={consistency}
          receivedHeaders={parsedEmail.receivedHeaders}
        />
      )}

      {/* Threat Intelligence & Artifacts Section */}
      {(threatIntel || artifacts) && (
        <ThreatIntelCard threatIntel={threatIntel} artifacts={artifacts} />
      )}

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <div className="rounded-lg bg-[#141417] p-3.5 border border-[#27272A]">
          <div className="flex items-center gap-1.5 font-semibold text-[#F4F4F5] text-xs uppercase tracking-wider">
            <Paperclip className="h-3.5 w-3.5 text-amber-400" />
            <span>Attachment Metadata ({attachments.length})</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {attachments.map((att, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-md border border-[#27272A] bg-[#18181B] px-2.5 py-1.5 text-[11px]"
              >
                <div className="flex items-center gap-1.5 font-medium text-[#F4F4F5] truncate">
                  <Paperclip className="h-3 w-3 shrink-0 text-[#71717A]" />
                  <span className="truncate">{att.filename}</span>
                </div>
                <div className="flex items-center gap-2 text-[#71717A] shrink-0 font-mono text-[10px]">
                  <span>{att.contentType}</span>
                  <span>•</span>
                  <span>{att.formattedSize}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Body Preview */}
      <div className="rounded-lg bg-[#141417] p-3.5 border border-[#27272A]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
          Extracted Plain Text Body
        </span>
        <p className="mt-1 max-h-36 overflow-y-auto font-mono text-xs leading-relaxed text-[#D4D4D8] whitespace-pre-wrap">
          {bodyText}
        </p>
      </div>
    </div>
  );
}
