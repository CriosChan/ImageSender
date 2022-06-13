/**
 * @name ImageSender
 * @author CriosChan
 * @description A plugin allowing to send any photo from nekos.life in one click
 * @version 0.0.1
 * @invite R7vuNSv
 * @authorid 328191996579545088
 * @updateUrl https://raw.githubusercontent.com/CriosChan/ImageSender/main/ImageSender.plugin.js
 * @website https://github.com/CriosChan/
 * @source https://github.com/CriosChan/ImageSender
 */

 const fs = require('fs');
 const path = require("path");
 
 module.exports = (() => {
 
 const config = {
     info:{
         name:"ImageSender",
         authors:[{
             name:"CriosChan",
             discord_id:"328191996579545088",
             github_username:"CriosChan",
         }],
         version:"0.0.1",
         description:"This plugin allows you to easily send an image from your PC, like memes for example!",
         github:"https://github.com/CriosChan/ImageSender",
         github_raw:"https://raw.githubusercontent.com/CriosChan/ImageSender/main/ImageSender.plugin.js"
     },
     defaultConfig:
     [
        {
            type: "textbox",
            name: "Image Folder Path",
            id: "folder",
            value: ""
        },
        {
            type: "switch",
			name: "Use subfolders ?",
			note: "Allows you to search in the subfolders. ⚠️ The more subfolders your folder has the more likely you are to lag. 🛑High risk of crashing if you have a lot of subfolders",
			id: "subfolders",
			value: false
        },
        {
            type: "switch",
			name: "Nitro User ?",
			note: "Allows you to send larger files. Files that are too big are not shown in the interface.",
			id: "nitro",
			value: false
        }
     ],
     changelog: [
         {
             title: "NSFW",
             type: "fixed",
             items: [
                 "Deletion of all NSFW that do not work or crash discord. Waiting for a fix.",
             ]
         }
     ],
     main: "index.js"
 };
 
 return !global.ZeresPluginLibrary ? class {
     constructor() { this._config = config; }
 
     getName = () => config.info.name;
     getAuthor = () => config.info.description;
     getVersion = () => config.info.version;
 
     load()
     {
         BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
             confirmText: "Download Now",
             cancelText: "Cancel",
             onConfirm: () =>
             {
                 require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (err, res, body) =>
                 {
                     if (err) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                     await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                 });
             }
         });
     }
 
     start() { }
     stop() { }
 } : (([Plugin, Api]) => {
     
     const plugin = (Plugin, Api) =>
     {
         const buttonHTML = `<div class="buttonContainer-2lnNiN da-buttonContainer imagesender">
         <button aria-label="ImageSender" tabindex="0" type="button" class="buttonWrapper-1ZmCpA da-buttonWrapper button-3BaQ4X button-f2h6uQ lookBlank-21BCro colorBrand-I6CyqQ grow-2sR_-F noFocus-2C7BQj da-noFocus">
             <div class="contents-18-Yxp da-contents button-3AYNKb da-button button-318s1X da-button" style="background: url('https://raw.githubusercontent.com/CriosChan/ImageSender/main/logo.png'); width: 30px; height: 30px; background-size: cover; background-position: center">
             </div>
         </button>
     </div>`;
  
         const {DiscordSelectors, PluginUtilities, DOMTools, Toasts, DiscordModules: { UserStore: { getCurrentUser } }} = Api;
         return class ImageSender extends Plugin {
             constructor()
             {
                 super();
             }
             
             async showChangelog(footer)
             {
                 try { footer = (await WebpackModules.getByProps("getUser", "acceptAgreements").getUser("328191996579545088")).tag + " | https://discord.gg/R7vuNSv"; }
                 finally { super.showChangelog(footer); }
             }
                             
             getDataName = () => this.getName() + "." + getCurrentUser().id;
             loadSettings = s => PluginUtilities.loadSettings(this.getDataName(), PluginUtilities.loadSettings(this.getName(), s || this.defaultSettings));
             saveSettings = s => PluginUtilities.saveSettings(this.getDataName(), this.settings || s);
             
             getSettingsPanel() {
                 const panel = this.buildSettingsPanel();
                         
                 panel.addListener(() => {
                     this.term();
                     this.init();
                 });
 
                 return panel.getElement();
             }
 
             onStart = () => this.init();
             onStop = () => this.term();
 
             init()
             {
                 const form = document.querySelector("form");
                 if (form) this.addButton();
             }
 
             term()
             {
                 const button = document.querySelector(".imagesender");
                 if (button) button.remove();
                 if(document.getElementById("imagesendersendpanel") != null){
                     document.getElementById("imagesendersendpanel").remove()
                 }
                 PluginUtilities.removeStyle(this.getName());
             }
 
             createbuttons(img){
                 const buttonhtml = `<div class="buttonContainer-28fw2U da-buttonContainer imagesenderSub" style=''>
                                 <button style="background: url(${img}); width: 150px; height: 150px; background-size: contain; margin: 4px; background-position: center; background-repeat: no-repeat" aria-label="HugButtonHTML" tabindex="0" type="button" class="buttonWrapper-1ZmCpA da-buttonWrapper button-3BaQ4X button-f2h6uQ lookBlank-21BCro colorBrand-I6CyqQ grow-2sR_-F noFocus-2C7BQj da-noFocus">
                                     <div class="contents-18-Yxp da-contents button-3AYNKb da-button button-318s1X da-button" style="color: black; font: bold 15px/1 sans-serif; text-shadow: 2px 0 0 #fff, -2px 0 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff, 1px 1px #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;">
                                     </div>
                                 </button>
                         </div>`;
                     const imagebutton = DOMTools.createElement(buttonhtml);
                     document.getElementById("imagesendermain").append(imagebutton);
                     return imagebutton;
             }
             
             addButton() {
                 const form = document.querySelector("form");
                 if (form.querySelector(".imagesender")) return;
                 const button = DOMTools.createElement(buttonHTML);
                 form.querySelector(DiscordSelectors.Textarea.buttons).append(button);
                 button.addEventListener("click", () => {
                     const html = `<div class="layerContainer-2v_Sit" id="imagesendersendpanel">
                                 <div class="layer-1Ixpg3">
                                 <div class="backdrop-2ByYRN withLayer-2VVmpp" style="opacity: 0.85; background: hsl(0, calc(var(--saturation-factor, 1) * 0%), 0%);"></div>
                                     <div class="focusLock-2tveLW" role="dialog" aria-labelledby="uid_714" tabindex="-1" aria-modal="true">
                                         <div class="root-g14mjS small-23Atuv fullscreenOnMobile-ixj0e3" style="opacity: 1; transform: scale(1); width: 720px;">
                                             <div class="flex-2S1XBF flex-3BkGQD horizontal-112GEH horizontal-1Piu5- flex-3BkGQD directionRow-2Iu2A9 justifyStart-2Mwniq alignCenter-14kD11 noWrap-hBpHBz header-1zd7se" id="uid_714" style="flex: 0 0 auto;">
                                                 <h2 class="wrapper-1HSdhi fontDisplay-3Gtuks base-21yXnu size20-9iTTnl" style="color:white;font-size:24px">Image Sender </h2>
                                                 <img src="https://raw.githubusercontent.com/CriosChan/ImageSender/main/logo.png" style="width: 40px; height: 40px"/>
                                             </div>
                                             <div class="content-2hZxGK content-26qlhD thin-31rlnD scrollerBase-_bVAAt" dir="ltr" style="overflow: hidden scroll; padding-right: 8px;">
                                                 <div class="markdown-19oyJN">
                                                     <div class="paragraph-9M861H" id='imagesenderButtons'>
                                                         <div class="flex-2S1XBF flex-3BkGQD horizontal-112GEH horizontal-1Piu5- flex-3BkGQD directionRow-2Iu2A9 justifyStart-2Mwniq alignCenter-14kD11 noWrap-hBpHBz header-1zd7se" id="uid_714" style="flex: 0 0 auto;">
                                                             <div id="imagesendermain" style="display: grid; height: 100%; width: 100%; grid-template-columns: auto auto auto auto;">
                                                             
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div aria-hidden="true" style="position: absolute; pointer-events: none; min-height: 0px; min-width: 1px; flex: 0 0 auto; height: 20px;"></div>
                                             </div>
                                             <div id="closebutton" class="flex-2S1XBF flex-3BkGQD horizontalReverse-60Katr horizontalReverse-2QssvL flex-3BkGQD directionRowReverse-HZatnx justifyStart-2Mwniq alignStretch-Uwowzr noWrap-hBpHBz footer-31IekZ" style="flex: 0 0 auto;">
                                             
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             `;
                     document.querySelector("#app-mount").insertAdjacentHTML('beforeEnd', html);
                     const closebutton = DOMTools.createElement(`<button type="submit" class="button-f2h6uQ lookFilled-yCfaCM colorBrand-I6CyqQ sizeMedium-2bFIHr grow-2sR_-F"><div class="contents-3ca1mk">Close</div></button>`)
                     document.getElementById("closebutton").append(closebutton)
                     closebutton.addEventListener("click", () => {
                         document.getElementById("imagesendersendpanel").remove()
                     })
                     
                     let folder = this.settings.folder

                     if(folder != ''){
                        this.readandcreate(folder)                        
                    } else {
                        Toasts.show("[IMAGESENDER] Please go to settings and set a path", { type: "error" })
                    }
                 })
             }

             readandcreate(folder){
                const folderName = path.basename(folder).toLowerCase().replace(/ /g, "")
                fs.readdir(folder, async (err, filenames) => {
                    if (err) {
                        Toasts.show("ImageSender: Failed to load folder named '" + folderName + "'!", { type: "error" });

                        return console.error(err);
                    }

                    for (let filename of filenames) {
                        const fp = path.join(folder, filename);
                        const stats = fs.statSync(fp)
                        if(this.settings.subfolders && stats.isDirectory()){
                            this.readandcreate(folder + "\\" + filename)
                        }

                        const ext = filename.split(".")[filename.split(".").length - 1];

                        if (!filename.includes(".") || !["jpg", "jpeg", "png", "gif", "bmp"].includes(ext))
                            continue;

                        const fileSizeInBytes = stats.size;
                        const fileSizeInMegabytes = fileSizeInBytes / (1024*1000);

                        //log(fileSizeInBytes, "log")

                        if(fileSizeInMegabytes > 8 && !this.settings.nitro) continue;
                        if(fileSizeInMegabytes > 100 && this.settings.nitro) continue;

                        const data = await new Promise(r => fs.readFile(fp, "base64", (_, d) => r(d)));

                        this.createbuttons("data:image/" + ext + ";base64," + data).addEventListener("click", () => {
                            this.send("data:image/" + ext + ";base64," + data, filename)
                        });
                    }
                });
             }
 
             send(data, filename){
                let channelID = BdApi.findModuleByProps("getLastSelectedChannelId").getChannelId();
                BdApi.findModuleByProps("upload", "instantBatchUpload").upload({
                    channelId: channelID,
                    file: this.dataURLtoFile(data, filename),
                    draftType: 0,
                    message: {
                        "channelId": channelID,
                        "content": "",
                        "tts": false,
                        "invalidEmojis": [],
                        "validNonShortcutEmojis": []
                    },
                    hasSpoiler: false,
                    filename: filename,
                })
            }
            dataURLtoFile(dataurl, filename) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], filename, {type:mime});
            }
                 
             observer(e) {
                 if (!e.addedNodes.length || !e.addedNodes[0] || !e.addedNodes[0].querySelector) return;
                 const form = e.addedNodes[0].querySelector(DiscordSelectors.Textarea.inner);
                 if (form) this.addButton(form);
             }
 
         };
     };
     return plugin(Plugin, Api);
 })(global.ZeresPluginLibrary.buildPlugin(config));
 })();