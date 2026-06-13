//
//  ViewController.swift
//  Shared (App)
//
//  Created by sam2k on 13/06/2026.
//

import WebKit

#if os(iOS)
import UIKit
typealias PlatformViewController = UIViewController
#elseif os(macOS)
import Cocoa
import SafariServices
typealias PlatformViewController = NSViewController
#endif

let extensionBundleIdentifier = "eu.tangerinetech.fontchanger.Extension"

let repoURL = "https://github.com/spashii/font-changer"
// TODO: set the real numeric App Store id once published. The
// ?action=write-review query opens the App Store review sheet directly,
// Apple's recommended deep link for an explicit "rate us" button.
let appStoreID = "0000000000"
let appStoreReviewURL = "https://apps.apple.com/app/id\(appStoreID)?action=write-review"

class ViewController: PlatformViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

#if os(iOS)
        self.webView.scrollView.isScrollEnabled = false
#endif

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
#if os(iOS)
        webView.evaluateJavaScript("show('ios')")
#elseif os(macOS)
        webView.evaluateJavaScript("show('mac')")

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), false)")
                }
            }
        }
#endif
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let action = message.body as? String else { return }

#if os(iOS)
        func open(_ string: String) {
            if let url = URL(string: string) { UIApplication.shared.open(url) }
        }
        switch action {
        case "open-settings":
            // Opens this app's page in Settings; from there the user reaches
            // Safari → Extensions to enable Font Changer.
            open(UIApplication.openSettingsURLString)
        case "rate-app":
            open(appStoreReviewURL)
        case "star-repo":
            open(repoURL)
        default:
            break
        }
#elseif os(macOS)
        switch action {
        case "open-preferences":
            SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
                guard error == nil else {
                    // Insert code to inform the user that something went wrong.
                    return
                }

                DispatchQueue.main.async {
                    NSApp.terminate(self)
                }
            }
        case "rate-app":
            if let url = URL(string: appStoreReviewURL) { NSWorkspace.shared.open(url) }
        case "star-repo":
            if let url = URL(string: repoURL) { NSWorkspace.shared.open(url) }
        default:
            break
        }
#endif
    }

}
