import re

with open('src/app/page.js', 'r') as f:
    lines = f.readlines()

import_lines = []
home_start = -1
for i, line in enumerate(lines):
    if line.startswith('import'):
        import_lines.append(line)
    if 'export default function Home()' in line:
        home_start = i
        break

# Extract the body of Home
body_lines = []
bracket_count = 0
in_home = False
home_end = -1
for i in range(home_start, len(lines)):
    line = lines[i]
    if '{' in line:
        bracket_count += line.count('{')
    if '}' in line:
        bracket_count -= line.count('}')
    
    if bracket_count == 0 and i > home_start:
        home_end = i
        break

# The return statements starts at line 476 `if (status === "loading") {`
# We need to find where the returns start
return_start = -1
for i in range(home_start, home_end):
    if 'if (status === "loading")' in lines[i]:
        return_start = i
        break

state_logic = lines[home_start+1:return_start]

# Remove the useTheme line from state_logic
state_logic = [line for line in state_logic if 'useTheme' not in line]

hook_content = """import { useState, useEffect, useRef } from "react";
import localforage from "localforage";
import { useSession } from "next-auth/react";

export function useAutoMailer() {
""" + "".join(state_logic) + """
  return {
    session, status,
    mounted, setMounted,
    postText, setPostText,
    fields, setFields,
    userProfile, setUserProfile,
    subject, setSubject,
    emailBody, setEmailBody,
    isManuallyEdited, setIsManuallyEdited,
    settings, setSettings,
    activeTab, setActiveTab,
    history, setHistory,
    isFollowUp, setIsFollowUp,
    isColdEmail, setIsColdEmail,
    coldEmailRole, setColdEmailRole,
    settingsOpen, setSettingsOpen,
    hasGeminiKey, setHasGeminiKey,
    hasGmailConfig, setHasGmailConfig,
    resumeExists, setResumeExists,
    resumeFile, setResumeFile,
    isParsing, setIsParsing,
    isSending, setIsSending,
    isUploading, setIsUploading,
    isTailoring, setIsTailoring,
    isSavingSettings, setIsSavingSettings,
    availableModels, setAvailableModels,
    isFetchingModels, setIsFetchingModels,
    logs, setLogs,
    fileInputRef, imageInputRef,
    screenshotData, setScreenshotData,
    screenshotName, setScreenshotName,
    handleImageUploadClick, handleImageChange, handleParsePost,
    handleUploadClick, handleFileChange, handleTailorResume, handleSendEmail,
    handleSaveSettings,
  };
}
"""

with open('src/hooks/useAutoMailer.js', 'w') as f:
    f.write(hook_content)

new_page_lines = lines[:home_start+1]
new_page_lines.append("  const { theme, setTheme } = useTheme();\n")
new_page_lines.append("  const am = useAutoMailer();\n")
new_page_lines.append("\n")

# Replace all variables in the return statements with am.variable
returns_code = "".join(lines[return_start:home_end+1])

# Variables to prefix with am.
variables = [
    "session", "status", "mounted", "postText", "setPostText",
    "fields", "setFields", "subject", "setSubject",
    "emailBody", "setEmailBody", "isManuallyEdited", "setIsManuallyEdited",
    "settings", "setSettings", "activeTab", "setActiveTab",
    "history", "setHistory", "isFollowUp", "setIsFollowUp",
    "isColdEmail", "setIsColdEmail", "coldEmailRole", "setColdEmailRole",
    "settingsOpen", "setSettingsOpen", "hasGeminiKey", "hasGmailConfig",
    "resumeExists", "resumeFile", "isParsing", "isSending",
    "isUploading", "isTailoring", "isSavingSettings",
    "availableModels", "isFetchingModels", "logs",
    "fileInputRef", "imageInputRef", "screenshotData", "setScreenshotData",
    "screenshotName", "setScreenshotName",
    "handleImageUploadClick", "handleImageChange", "handleParsePost",
    "handleUploadClick", "handleFileChange", "handleTailorResume", "handleSendEmail",
    "handleSaveSettings"
]

import re
for var in variables:
    # Use regex to match exact word boundaries, to avoid matching substrings
    returns_code = re.sub(r'(?<!\w|\.)' + var + r'(?!\w)', f'am.{var}', returns_code)

new_page_lines.append(returns_code)

# Add imports for useAutoMailer
for i, line in enumerate(new_page_lines):
    if line.startswith('export default function Home()'):
        new_page_lines.insert(i, 'import { useAutoMailer } from "@/hooks/useAutoMailer";\n')
        break

# Clean up imports (remove useState, localforage from page.js)
filtered_page_lines = []
for line in new_page_lines:
    if 'useState' in line or 'localforage' in line:
        continue
    filtered_page_lines.append(line)

with open('src/app/page.js', 'w') as f:
    f.writelines(filtered_page_lines)

