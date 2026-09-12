"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Navbar from "@/components/Navbar";
import JobInput from "@/components/JobInput";
import SettingsDrawer from "@/components/SettingsDrawer";
import ExtractedFieldsTab from "@/components/ExtractedFieldsTab";
import HistoryTab from "@/components/HistoryTab";
import EmailPreviewTab from "@/components/EmailPreviewTab";
import LandingPage from "@/components/LandingPage";
import { useAutoMailer } from "@/hooks/useAutoMailer";

import { ArrowLeftRight } from "lucide-react";

function HomeContent() {
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const showLanding = searchParams.get("view") === "landing";
  const am = useAutoMailer();

  if (am.status === "loading") {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (am.status === "unauthenticated" || showLanding) {
    return <LandingPage session={am.session} />;
  }

  const isInputMode = am.viewMode === "input";

  return (
    <div className="app-container">
      <Navbar
        mounted={am.mounted}
        theme={theme}
        setTheme={setTheme}
        setSettingsOpen={am.setSettingsOpen}
        session={am.session}
      />

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {isInputMode ? (
          <JobInput
            postText={am.postText}
            setPostText={am.setPostText}
            logs={am.logs}
            handleImageUploadClick={am.handleImageUploadClick}
            imageInputRef={am.imageInputRef}
            handleImageChange={am.handleImageChange}
            screenshotName={am.screenshotName}
            setScreenshotData={am.setScreenshotData}
            setScreenshotName={am.setScreenshotName}
            isParsing={am.isParsing}
            screenshotData={am.screenshotData}
            handleParsePost={am.handleParsePost}
            isSharedFromLinkedIn={am.isSharedFromLinkedIn}
            viewMode={am.viewMode}
            setViewMode={am.setViewMode}
            hasExtracted={Boolean(am.fields.email || am.fields.jobTitle)}
          />
        ) : (
          <div className="card" style={{ minHeight: "550px", justifyContent: "flex-start" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
              <div className="tabs">
                <button
                  className={`tab ${am.activeTab === "preview" ? "active" : ""}`}
                  onClick={() => am.setActiveTab("preview")}
                >
                  Email Preview
                </button>
                <button
                  className={`tab ${am.activeTab === "details" ? "active" : ""}`}
                  onClick={() => am.setActiveTab("details")}
                >
                  Extracted Fields
                </button>
                <button
                  className={`tab ${am.activeTab === "history" ? "active" : ""}`}
                  onClick={() => am.setActiveTab("history")}
                >
                  History
                </button>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => am.setViewMode("input")}
                title="Switch to Job Description"
                aria-label="Switch to Job Description"
              >
                <ArrowLeftRight size={16} />
              </button>
            </div>

            {am.activeTab === "details" && (
              <ExtractedFieldsTab fields={am.fields} setFields={am.setFields} />
            )}

            {am.activeTab === "history" && (
              <HistoryTab
                history={am.history}
                setFields={am.setFields}
                setIsFollowUp={am.setIsFollowUp}
                setActiveTab={am.setActiveTab}
                setIsManuallyEdited={am.setIsManuallyEdited}
              />
            )}

            {am.activeTab === "preview" && (
              <EmailPreviewTab
                isFollowUp={am.isFollowUp}
                setIsFollowUp={am.setIsFollowUp}
                fields={am.fields}
                setFields={am.setFields}
                subject={am.subject}
                setSubject={am.setSubject}
                emailBody={am.emailBody}
                setEmailBody={am.setEmailBody}
                setIsManuallyEdited={am.setIsManuallyEdited}
                resumeExists={am.resumeExists}
                resumeFile={am.resumeFile}
                settings={am.settings}
                handleTailorResume={am.handleTailorResume}
                isTailoring={am.isTailoring}
                handleUploadClick={am.handleUploadClick}
                isUploading={am.isUploading}
                fileInputRef={am.fileInputRef}
                handleFileChange={am.handleFileChange}
                isSending={am.isSending}
                hasGmailConfig={am.hasGmailConfig}
                handleSendEmail={am.handleSendEmail}
              />
            )}
          </div>
        )}
      </div>

      <SettingsDrawer
        settingsOpen={am.settingsOpen}
        setSettingsOpen={am.setSettingsOpen}
        settings={am.settings}
        setSettings={am.setSettings}
        isFetchingModels={am.isFetchingModels}
        availableModels={am.availableModels}
        isSavingSettings={am.isSavingSettings}
        handleSaveSettings={am.handleSaveSettings}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner spinner-lg"></div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

