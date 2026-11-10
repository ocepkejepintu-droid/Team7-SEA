import { useCallback, useSyncExternalStore } from "react";

/** English is the source of truth: its keys define what every language must have. */
const en = {
  "app.tagline": "Spot trash. Clean it. Help your beach win.",
  "app.offline": "Can't reach the server. Retrying…",

  "tab.map": "Map",
  "tab.league": "League",
  "tab.me": "Me",
  "tab.aria": "Main",

  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.theme": "Appearance",
  "settings.light": "Light",
  "settings.dark": "Dark",

  "onb.step1.title": "Report",
  "onb.step1.text": "Snap a photo of trash",
  "onb.step2.title": "Clean",
  "onb.step2.text": "Pick it up, snap again",
  "onb.step3.title": "Climb",
  "onb.step3.text": "Your beach moves up",
  "onb.nickname": "Your nickname",
  "onb.placeholder": "e.g. Wayan the Wave",
  "onb.hint": "2 to 20 characters. Other players will see it.",
  "onb.buddy": "Pick your buddy",
  "onb.avatar": "Avatar",
  "onb.joining": "Joining…",
  "onb.start": "Start playing",

  "err.server": "Can't reach the server. Check your connection.",
  "err.tooBig": "That photo is too big. Try another one.",
  "err.slow": "Slow down a little, then try again.",
  "err.generic": "Something went wrong. Try again.",
  "err.photo": "We couldn't read that photo. Try another one.",
  "err.alreadyCleaned": "Someone already cleaned this one.",

  "league.title": "League",
  "league.subtitle": "The cleanest beach this week wins.",
  "league.beaches": "Beaches",
  "league.players": "Players",
  "league.weekly": "Weekly challenge",
  "league.goalMet": "Goal reached. Great work, everyone!",
  "league.cleanGoal": "Clean {goal} spots this week",
  "league.noBeaches.title": "No beaches in the league yet",
  "league.noBeaches.text": "Report trash on any beach to put it on the board.",
  "league.winner": "This week's winner",
  "league.health": "health",
  "league.winnerLine": "Cleanest beach this week · {open} open · {cleaned} cleaned",
  "league.row": "{open} open · {cleaned} cleaned this week",
  "league.needsHelp": "Needs help",
  "league.unranked": "{count} more beaches have no reports yet",
  "league.unranked_one": "{count} more beach has no reports yet",
  "league.noPlayers.title": "No players yet",
  "league.noPlayers.text": "Be the first to report some trash.",
  "league.you": "You",
  "league.pts": "pts",
  "common.loading": "Loading",
  "common.close": "Close",
  "common.back": "Back",

  "banner.cleaned": "cleaned this week",
  "banner.aria": "Weekly challenge: {done} of {goal} spots cleaned this week",

  "me.points": "points",
  "me.rank": "#{rank} of {total} players",
  "me.reportsMade": "reports made",
  "me.spotsCleaned": "spots cleaned",
  "me.badges": "Badges",
  "me.earned": "Earned",
  "me.myReports": "My reports",
  "me.noReports.title": "No reports yet",
  "me.noReports.text": "Go to the Map and tap Report trash to make your first one.",
  "me.baliCoast": "Bali coast",

  "status.cleaned": "Cleaned",
  "status.open": "Open",

  "badge.first_report.name": "First report",
  "badge.first_report.how": "Report your first trash spot",
  "badge.first_clean.name": "First clean",
  "badge.first_clean.how": "Clean your first spot",
  "badge.ten_cleans.name": "Ten cleans",
  "badge.ten_cleans.how": "Clean 10 spots",
  "badge.hotspot_hunter.name": "Hotspot hunter",
  "badge.hotspot_hunter.how": "Clean a hotspot",
  "badge.big_haul.name": "Big haul",
  "badge.big_haul.how": "Clean a large pile",
  "badge.three_beaches.name": "Three beaches",
  "badge.three_beaches.how": "Report on 3 different beaches",

  "trash.plastic": "Plastic",
  "trash.bottles": "Bottles",
  "trash.nets": "Fishing nets",
  "trash.organic": "Organic",
  "trash.mixed": "Mixed trash",
  "trash.other": "Other",
  "size.S": "A handful",
  "size.M": "A bag",
  "size.L": "More than a bag",

  "time.now": "just now",
  "time.min": "{count} min ago",
  "time.hours": "{count} h ago",
  "time.days": "{count} days ago",
  "time.days_one": "{count} day ago",

  "toast.points": "points",
  "toast.newBadge": "New badge: {name}",
  "toast.reported": "Thanks for reporting!",
  "toast.cleaned": "Thanks for cleaning!",

  "map.reportTrash": "Report trash",
  "map.theCoast": "The coast",
  "map.aria": "Map of the Bali coast with trash reports",
  "map.style": "Map style",
  "map.map": "Map",
  "map.satellite": "Satellite",
  "map.zoomIn": "Zoom in",
  "map.zoomOut": "Zoom out",
  "map.locate": "Locate me",
  "map.health": "health",
  "map.openReports": "open reports",
  "map.openReports_one": "open report",
  "map.rank": "Rank #{rank} in the league",
  "map.noData": "No data yet this week",

  "photo.take": "Take a photo",
  "photo.takeAnother": "Take another photo",
  "photo.gallery": "Choose from gallery",
  "photo.yours": "Your photo",

  "report.preparing": "Getting your photo ready…",
  "report.looking": "Claude is looking at your photo…",
  "report.sending": "Sending your report…",
  "report.placePin": "Place the pin",
  "report.tapMap": "Tap the map where the trash is",
  "report.finding": "Finding the coast…",
  "report.confirm": "Confirm",
  "report.snap": "Snap the trash you see on the beach.",
  "report.claudeHelps": "Claude will help you tag it.",
  "report.claudeSees": "Claude sees:",
  "report.someTrash": "some trash",
  "report.pickWhat": "Pick what you see",
  "report.notSure": "Claude isn't sure this is trash. You can still report it.",
  "report.kind": "What kind?",
  "report.howMuch": "How much?",
  "report.youEarn": "You'll earn",
  "report.newPhoto": "New photo",
  "report.placeOnMap": "Place it on the map",

  "detail.title": "Trash report",
  "detail.cleaned": "✓ Cleaned",
  "detail.hotspot": "🔥 Hotspot ×2",
  "detail.demo": "demo",
  "detail.reportedBy": "Reported {when} by {name}",
  "detail.aPlayer": "a player",
  "detail.theCoast": "the coast",
  "detail.before": "Before",
  "detail.after": "After",
  "detail.theTrash": "The trash",
  "detail.cleanScore": "Clean score",
  "detail.cleanedBy": "Cleaned by {name} {when}.",
  "detail.cleanedByUnverified": "Cleaned by {name} {when} (unverified).",
  "detail.checking": "Claude is checking your cleanup…",
  "detail.nice": "Nice work!",
  "detail.won": "You won +{points} points",
  "detail.unverified": "Claude couldn't check this one, so it counts as unverified.",
  "detail.stillTrash": "Claude still sees trash. Try another photo.",
  "detail.passNote": "A score of {pass} or more counts as clean.",
  "detail.iCleaned": "I cleaned this",
  "detail.afterHint": "Take an \"after\" photo of the same spot, so Claude can see it's clean.",
  "detail.tryAnother": "Try another photo",
  "detail.takeAfter": "Take the after photo",
};

export type Key = keyof typeof en;
type Dict = Record<Key, string>;

const zh: Dict = {
  "app.tagline": "发现垃圾，动手清理，帮你的海滩夺冠。",
  "app.offline": "无法连接服务器，正在重试…",

  "tab.map": "地图",
  "tab.league": "联赛",
  "tab.me": "我的",
  "tab.aria": "主导航",

  "settings.title": "设置",
  "settings.language": "语言",
  "settings.theme": "外观",
  "settings.light": "浅色",
  "settings.dark": "深色",

  "onb.step1.title": "上报",
  "onb.step1.text": "拍下垃圾的照片",
  "onb.step2.title": "清理",
  "onb.step2.text": "捡起来，再拍一张",
  "onb.step3.title": "上榜",
  "onb.step3.text": "你的海滩排名上升",
  "onb.nickname": "你的昵称",
  "onb.placeholder": "例如：海浪小瓦扬",
  "onb.hint": "2 到 20 个字符，其他玩家可以看到。",
  "onb.buddy": "选一个伙伴",
  "onb.avatar": "头像",
  "onb.joining": "正在加入…",
  "onb.start": "开始游戏",

  "err.server": "无法连接服务器，请检查网络。",
  "err.tooBig": "照片太大了，换一张试试。",
  "err.slow": "慢一点，稍后再试。",
  "err.generic": "出了点问题，请再试一次。",
  "err.photo": "无法读取这张照片，换一张试试。",
  "err.alreadyCleaned": "这里已经有人清理过了。",

  "league.title": "联赛",
  "league.subtitle": "本周最干净的海滩获胜。",
  "league.beaches": "海滩",
  "league.players": "玩家",
  "league.weekly": "每周挑战",
  "league.goalMet": "目标达成，大家辛苦了！",
  "league.cleanGoal": "本周清理 {goal} 处垃圾",
  "league.noBeaches.title": "联赛里还没有海滩",
  "league.noBeaches.text": "在任意海滩上报垃圾，就能让它上榜。",
  "league.winner": "本周冠军",
  "league.health": "健康度",
  "league.winnerLine": "本周最干净的海滩 · {open} 处待清理 · {cleaned} 处已清理",
  "league.row": "{open} 处待清理 · 本周已清理 {cleaned} 处",
  "league.needsHelp": "需要帮助",
  "league.unranked": "还有 {count} 个海滩暂无上报",
  "league.unranked_one": "还有 {count} 个海滩暂无上报",
  "league.noPlayers.title": "还没有玩家",
  "league.noPlayers.text": "来做第一个上报垃圾的人吧。",
  "league.you": "我",
  "league.pts": "分",
  "common.loading": "加载中",
  "common.close": "关闭",
  "common.back": "返回",

  "banner.cleaned": "本周已清理",
  "banner.aria": "每周挑战：本周已清理 {done} 处，目标 {goal} 处",

  "me.points": "积分",
  "me.rank": "第 {rank} 名，共 {total} 名玩家",
  "me.reportsMade": "次上报",
  "me.spotsCleaned": "处已清理",
  "me.badges": "徽章",
  "me.earned": "已获得",
  "me.myReports": "我的上报",
  "me.noReports.title": "还没有上报",
  "me.noReports.text": "去地图页点“上报垃圾”，完成你的第一次上报。",
  "me.baliCoast": "巴厘岛海岸",

  "status.cleaned": "已清理",
  "status.open": "待清理",

  "badge.first_report.name": "首次上报",
  "badge.first_report.how": "上报你的第一处垃圾",
  "badge.first_clean.name": "首次清理",
  "badge.first_clean.how": "清理你的第一处垃圾",
  "badge.ten_cleans.name": "十次清理",
  "badge.ten_cleans.how": "清理 10 处垃圾",
  "badge.hotspot_hunter.name": "热点猎手",
  "badge.hotspot_hunter.how": "清理一个热点",
  "badge.big_haul.name": "大丰收",
  "badge.big_haul.how": "清理一大堆垃圾",
  "badge.three_beaches.name": "三处海滩",
  "badge.three_beaches.how": "在 3 个不同的海滩上报",

  "trash.plastic": "塑料",
  "trash.bottles": "瓶子",
  "trash.nets": "渔网",
  "trash.organic": "有机垃圾",
  "trash.mixed": "混合垃圾",
  "trash.other": "其他",
  "size.S": "一小把",
  "size.M": "一袋",
  "size.L": "超过一袋",

  "time.now": "刚刚",
  "time.min": "{count} 分钟前",
  "time.hours": "{count} 小时前",
  "time.days": "{count} 天前",
  "time.days_one": "{count} 天前",

  "toast.points": "积分",
  "toast.newBadge": "新徽章：{name}",
  "toast.reported": "感谢你的上报！",
  "toast.cleaned": "感谢你的清理！",

  "map.reportTrash": "上报垃圾",
  "map.theCoast": "海岸",
  "map.aria": "巴厘岛海岸地图及垃圾上报点",
  "map.style": "地图样式",
  "map.map": "地图",
  "map.satellite": "卫星",
  "map.zoomIn": "放大",
  "map.zoomOut": "缩小",
  "map.locate": "定位我的位置",
  "map.health": "健康度",
  "map.openReports": "处待清理",
  "map.openReports_one": "处待清理",
  "map.rank": "联赛第 {rank} 名",
  "map.noData": "本周暂无数据",

  "photo.take": "拍照",
  "photo.takeAnother": "重新拍一张",
  "photo.gallery": "从相册选择",
  "photo.yours": "你的照片",

  "report.preparing": "正在处理照片…",
  "report.looking": "Claude 正在查看你的照片…",
  "report.sending": "正在发送上报…",
  "report.placePin": "放置图钉",
  "report.tapMap": "在地图上点一下垃圾所在的位置",
  "report.finding": "正在寻找海岸…",
  "report.confirm": "确认",
  "report.snap": "拍下你在海滩上看到的垃圾。",
  "report.claudeHelps": "Claude 会帮你分类。",
  "report.claudeSees": "Claude 看到：",
  "report.someTrash": "一些垃圾",
  "report.pickWhat": "选择你看到的垃圾",
  "report.notSure": "Claude 不确定这是不是垃圾，你仍然可以上报。",
  "report.kind": "什么类型？",
  "report.howMuch": "有多少？",
  "report.youEarn": "你将获得",
  "report.newPhoto": "换照片",
  "report.placeOnMap": "标到地图上",

  "detail.title": "垃圾上报",
  "detail.cleaned": "✓ 已清理",
  "detail.hotspot": "🔥 热点 ×2",
  "detail.demo": "演示",
  "detail.reportedBy": "{when}由 {name} 上报",
  "detail.aPlayer": "一位玩家",
  "detail.theCoast": "海岸",
  "detail.before": "清理前",
  "detail.after": "清理后",
  "detail.theTrash": "垃圾照片",
  "detail.cleanScore": "清洁得分",
  "detail.cleanedBy": "{when}由 {name} 清理。",
  "detail.cleanedByUnverified": "{when}由 {name} 清理（未验证）。",
  "detail.checking": "Claude 正在检查你的清理成果…",
  "detail.nice": "干得漂亮！",
  "detail.won": "你获得了 +{points} 积分",
  "detail.unverified": "Claude 没能检查这一次，所以记为未验证。",
  "detail.stillTrash": "Claude 还是看到了垃圾，换一张照片试试。",
  "detail.passNote": "得分达到 {pass} 及以上才算清理干净。",
  "detail.iCleaned": "我清理好了",
  "detail.afterHint": "在同一位置拍一张“清理后”的照片，让 Claude 确认已经干净。",
  "detail.tryAnother": "换一张照片",
  "detail.takeAfter": "拍清理后的照片",
};

const id: Dict = {
  "app.tagline": "Temukan sampah. Bersihkan. Bantu pantaimu menang.",
  "app.offline": "Tidak bisa terhubung ke server. Mencoba lagi…",

  "tab.map": "Peta",
  "tab.league": "Liga",
  "tab.me": "Saya",
  "tab.aria": "Utama",

  "settings.title": "Pengaturan",
  "settings.language": "Bahasa",
  "settings.theme": "Tampilan",
  "settings.light": "Terang",
  "settings.dark": "Gelap",

  "onb.step1.title": "Lapor",
  "onb.step1.text": "Foto sampah yang kamu lihat",
  "onb.step2.title": "Bersihkan",
  "onb.step2.text": "Pungut, lalu foto lagi",
  "onb.step3.title": "Naik",
  "onb.step3.text": "Peringkat pantaimu naik",
  "onb.nickname": "Nama panggilanmu",
  "onb.placeholder": "mis. Wayan si Ombak",
  "onb.hint": "2 sampai 20 karakter. Pemain lain bisa melihatnya.",
  "onb.buddy": "Pilih temanmu",
  "onb.avatar": "Avatar",
  "onb.joining": "Bergabung…",
  "onb.start": "Mulai bermain",

  "err.server": "Tidak bisa terhubung ke server. Periksa koneksimu.",
  "err.tooBig": "Fotonya terlalu besar. Coba foto lain.",
  "err.slow": "Pelan-pelan dulu, lalu coba lagi.",
  "err.generic": "Terjadi kesalahan. Coba lagi.",
  "err.photo": "Foto itu tidak bisa dibaca. Coba foto lain.",
  "err.alreadyCleaned": "Yang ini sudah dibersihkan orang lain.",

  "league.title": "Liga",
  "league.subtitle": "Pantai terbersih minggu ini jadi juara.",
  "league.beaches": "Pantai",
  "league.players": "Pemain",
  "league.weekly": "Tantangan mingguan",
  "league.goalMet": "Target tercapai. Kerja bagus, semuanya!",
  "league.cleanGoal": "Bersihkan {goal} titik minggu ini",
  "league.noBeaches.title": "Belum ada pantai di liga",
  "league.noBeaches.text": "Laporkan sampah di pantai mana pun agar masuk papan peringkat.",
  "league.winner": "Juara minggu ini",
  "league.health": "kesehatan",
  "league.winnerLine": "Pantai terbersih minggu ini · {open} terbuka · {cleaned} dibersihkan",
  "league.row": "{open} terbuka · {cleaned} dibersihkan minggu ini",
  "league.needsHelp": "Butuh bantuan",
  "league.unranked": "{count} pantai lain belum punya laporan",
  "league.unranked_one": "{count} pantai lain belum punya laporan",
  "league.noPlayers.title": "Belum ada pemain",
  "league.noPlayers.text": "Jadilah yang pertama melaporkan sampah.",
  "league.you": "Kamu",
  "league.pts": "poin",
  "common.loading": "Memuat",
  "common.close": "Tutup",
  "common.back": "Kembali",

  "banner.cleaned": "bersih minggu ini",
  "banner.aria": "Tantangan mingguan: {done} dari {goal} titik dibersihkan minggu ini",

  "me.points": "poin",
  "me.rank": "#{rank} dari {total} pemain",
  "me.reportsMade": "laporan dibuat",
  "me.spotsCleaned": "titik dibersihkan",
  "me.badges": "Lencana",
  "me.earned": "Diraih",
  "me.myReports": "Laporan saya",
  "me.noReports.title": "Belum ada laporan",
  "me.noReports.text": "Buka Peta lalu ketuk Laporkan sampah untuk membuat laporan pertamamu.",
  "me.baliCoast": "Pesisir Bali",

  "status.cleaned": "Bersih",
  "status.open": "Terbuka",

  "badge.first_report.name": "Laporan pertama",
  "badge.first_report.how": "Laporkan titik sampah pertamamu",
  "badge.first_clean.name": "Bersih pertama",
  "badge.first_clean.how": "Bersihkan titik pertamamu",
  "badge.ten_cleans.name": "Sepuluh kali bersih",
  "badge.ten_cleans.how": "Bersihkan 10 titik",
  "badge.hotspot_hunter.name": "Pemburu titik panas",
  "badge.hotspot_hunter.how": "Bersihkan satu titik panas",
  "badge.big_haul.name": "Angkut besar",
  "badge.big_haul.how": "Bersihkan tumpukan besar",
  "badge.three_beaches.name": "Tiga pantai",
  "badge.three_beaches.how": "Lapor di 3 pantai berbeda",

  "trash.plastic": "Plastik",
  "trash.bottles": "Botol",
  "trash.nets": "Jaring ikan",
  "trash.organic": "Organik",
  "trash.mixed": "Sampah campuran",
  "trash.other": "Lainnya",
  "size.S": "Segenggam",
  "size.M": "Sekantong",
  "size.L": "Lebih dari sekantong",

  "time.now": "baru saja",
  "time.min": "{count} mnt lalu",
  "time.hours": "{count} jam lalu",
  "time.days": "{count} hari lalu",
  "time.days_one": "{count} hari lalu",

  "toast.points": "poin",
  "toast.newBadge": "Lencana baru: {name}",
  "toast.reported": "Terima kasih sudah melapor!",
  "toast.cleaned": "Terima kasih sudah membersihkan!",

  "map.reportTrash": "Laporkan sampah",
  "map.theCoast": "Pesisir",
  "map.aria": "Peta pesisir Bali dengan laporan sampah",
  "map.style": "Gaya peta",
  "map.map": "Peta",
  "map.satellite": "Satelit",
  "map.zoomIn": "Perbesar",
  "map.zoomOut": "Perkecil",
  "map.locate": "Temukan lokasi saya",
  "map.health": "kesehatan",
  "map.openReports": "laporan terbuka",
  "map.openReports_one": "laporan terbuka",
  "map.rank": "Peringkat #{rank} di liga",
  "map.noData": "Belum ada data minggu ini",

  "photo.take": "Ambil foto",
  "photo.takeAnother": "Ambil foto lain",
  "photo.gallery": "Pilih dari galeri",
  "photo.yours": "Fotomu",

  "report.preparing": "Menyiapkan fotomu…",
  "report.looking": "Claude sedang melihat fotomu…",
  "report.sending": "Mengirim laporanmu…",
  "report.placePin": "Letakkan pin",
  "report.tapMap": "Ketuk peta di lokasi sampah",
  "report.finding": "Mencari garis pantai…",
  "report.confirm": "Konfirmasi",
  "report.snap": "Foto sampah yang kamu lihat di pantai.",
  "report.claudeHelps": "Claude akan membantu menandainya.",
  "report.claudeSees": "Claude melihat:",
  "report.someTrash": "sampah",
  "report.pickWhat": "Pilih yang kamu lihat",
  "report.notSure": "Claude tidak yakin ini sampah. Kamu tetap bisa melaporkannya.",
  "report.kind": "Jenis apa?",
  "report.howMuch": "Seberapa banyak?",
  "report.youEarn": "Kamu akan dapat",
  "report.newPhoto": "Foto baru",
  "report.placeOnMap": "Letakkan di peta",

  "detail.title": "Laporan sampah",
  "detail.cleaned": "✓ Bersih",
  "detail.hotspot": "🔥 Titik panas ×2",
  "detail.demo": "demo",
  "detail.reportedBy": "Dilaporkan {when} oleh {name}",
  "detail.aPlayer": "seorang pemain",
  "detail.theCoast": "pesisir",
  "detail.before": "Sebelum",
  "detail.after": "Sesudah",
  "detail.theTrash": "Sampahnya",
  "detail.cleanScore": "Skor kebersihan",
  "detail.cleanedBy": "Dibersihkan oleh {name} {when}.",
  "detail.cleanedByUnverified": "Dibersihkan oleh {name} {when} (belum diverifikasi).",
  "detail.checking": "Claude sedang memeriksa hasil bersih-bersihmu…",
  "detail.nice": "Kerja bagus!",
  "detail.won": "Kamu mendapat +{points} poin",
  "detail.unverified": "Claude tidak bisa memeriksa yang ini, jadi dihitung belum diverifikasi.",
  "detail.stillTrash": "Claude masih melihat sampah. Coba foto lain.",
  "detail.passNote": "Skor {pass} atau lebih dihitung bersih.",
  "detail.iCleaned": "Sudah saya bersihkan",
  "detail.afterHint": "Ambil foto \"sesudah\" di titik yang sama agar Claude bisa melihat sudah bersih.",
  "detail.tryAnother": "Coba foto lain",
  "detail.takeAfter": "Ambil foto sesudah",
};

export type Lang = "en" | "zh" | "id";
export const DICTS: Record<Lang, Dict> = { en, zh, id };
/** `label` is each language's own name, so it is readable whatever the current language is. */
export const LANGS: { id: Lang; label: string; short: string; locale: string }[] = [
  { id: "en", label: "English", short: "EN", locale: "en" },
  { id: "zh", label: "中文", short: "中", locale: "zh-CN" },
  { id: "id", label: "Indonesia", short: "ID", locale: "id-ID" },
];
const isLang = (v: unknown): v is Lang => v === "en" || v === "zh" || v === "id";

export type Vars = Record<string, string | number>;
/** Fills `{name}` placeholders. With `count: 1` the `<key>_one` form is used when there is one. */
export function translate(lang: Lang, key: Key, vars?: Vars): string {
  const d = DICTS[lang];
  const one = `${key}_one` as Key;
  const s = vars?.count === 1 && one in d ? d[one] : d[key];
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

/** First supported language in the browser's list. Malay speakers get Indonesian; "in" is the legacy code for it. */
export function detectLang(prefs: readonly string[]): Lang {
  for (const p of prefs) {
    const base = p.toLowerCase().split("-")[0];
    if (base === "zh") return "zh";
    if (base === "id" || base === "in" || base === "ms") return "id";
    if (base === "en") return "en";
  }
  return "en";
}

const STORE = "pantai.lang";
function initial(): Lang {
  try { const v = localStorage.getItem(STORE); if (isLang(v)) return v; } catch { /* private mode */ }
  return typeof navigator === "undefined" ? "en" : detectLang(navigator.languages?.length ? navigator.languages : [navigator.language ?? "en"]);
}
const htmlLang = (l: Lang) => { if (typeof document !== "undefined") document.documentElement.lang = l === "zh" ? "zh-Hans" : l; };

let current: Lang = initial();
htmlLang(current);
const subs = new Set<() => void>();

export const getLang = (): Lang => current;
export function setLang(l: Lang) {
  if (l === current) return;
  current = l;
  try { localStorage.setItem(STORE, l); } catch { /* private mode */ }
  htmlLang(l);
  for (const f of subs) f();
}
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export type T = (key: Key, vars?: Vars) => string;
/** The current language, a `t()` bound to it and number formatting. Re-renders when the language changes. */
export function useI18n() {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  const t = useCallback<T>((key, vars) => translate(lang, key, vars), [lang]);
  const locale = LANGS.find((l) => l.id === lang)!.locale;
  const num = useCallback((n: number) => n.toLocaleString(locale), [locale]);
  return { lang, t, num, setLang };
}

/** "just now", "5 min ago", "3 h ago", "2 days ago" in the current language. */
export function timeAgo(t: T, iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return t("time.now");
  if (s < 3600) return t("time.min", { count: Math.floor(s / 60) });
  if (s < 86400) return t("time.hours", { count: Math.floor(s / 3600) });
  return t("time.days", { count: Math.floor(s / 86400) });
}

const TRASH_KEYS = new Set(["plastic", "bottles", "nets", "organic", "mixed", "other"]);
export const trashLabel = (t: T, type: string) => (TRASH_KEYS.has(type) ? t(`trash.${type}` as Key) : type);
export const sizeLabel = (t: T, size: string) => (size === "S" || size === "M" || size === "L" ? t(`size.${size}` as Key) : size);
export const badgeName = (t: T, id: string) => (`badge.${id}.name` in en ? t(`badge.${id}.name` as Key) : id);
export const badgeHow = (t: T, id: string) => (`badge.${id}.how` in en ? t(`badge.${id}.how` as Key) : "");
