-- 1. Kullanıcılar Tablosu
CREATE TABLE `Users` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `OAuth_Provider` varchar(50) NOT NULL COMMENT 'google, facebook vs.',
  `OAuth_ID` varchar(255) NOT NULL COMMENT 'Platformun verdiği benzersiz kimlik',
  `Email` varchar(255) DEFAULT NULL,
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `oauth_unique` (`OAuth_Provider`,`OAuth_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. İzleme Geçmişi Tablosu
CREATE TABLE `Watch_History` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `User_ID` int(11) NOT NULL,
  `Video_URL` text NOT NULL,
  `Platform` varchar(50) NOT NULL COMMENT 'youtube, twitch, kick',
  `Added_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  KEY `User_ID` (`User_ID`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`User_ID`) REFERENCES `Users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Paylaşılan Listeler Tablosu
CREATE TABLE `Shared_Lists` (
  `List_ID` varchar(36) NOT NULL COMMENT 'UUID v4',
  `User_ID` int(11) DEFAULT NULL COMMENT 'Anonim paylaşımlar için NULL kalabilir',
  `Videos_JSON` json NOT NULL COMMENT 'Videoların URL listesi',
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`List_ID`),
  KEY `User_ID` (`User_ID`),
  CONSTRAINT `fk_shared_user` FOREIGN KEY (`User_ID`) REFERENCES `Users` (`ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Liste Görüntülemeleri (Lider Tablosu ve Anti-Spam İçin)
CREATE TABLE `List_Views` (
  `View_ID` int(11) NOT NULL AUTO_INCREMENT,
  `List_ID` varchar(36) NOT NULL,
  `IP_Hash` varchar(64) NOT NULL COMMENT 'Ziyaretçi IP adresinin SHA-256 özeti',
  `View_Date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`View_ID`),
  KEY `List_ID` (`List_ID`),
  KEY `ip_time_idx` (`IP_Hash`,`View_Date`),
  CONSTRAINT `fk_views_list` FOREIGN KEY (`List_ID`) REFERENCES `Shared_Lists` (`List_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;