SET NAMES utf8;
DROP DATABASE IF EXISTS yunbizcash;
CREATE DATABASE yunbizcash;
ALTER DATABASE yunbizcash CHARACTER SET utf8;
USE yunbizcash;

CREATE TABLE `payouts` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `payoutsid` int(11) NOT NULL,
  `day_eachtime_amount` double NOT NULL,
  `miner` varchar(100) NOT NULL DEFAULT '',
  `start` int(11) NOT NULL,
  `end` int(11) NOT NULL,
  `txhash` varchar(100) NOT NULL DEFAULT '',
  `paidon` bigint(20) NOT NULL,
  `calculateflag` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  unique(`payoutsid`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE `zcashincome` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `payee` varchar(100) NOT NULL DEFAULT '',
  `date` bigint(20) NOT NULL,
  `description` varchar(50) DEFAULT NULL,
  `income` double NOT NULL,
  `outpay` double NOT NULL,
  `amount` double NOT NULL,
  `activeworker` int(11) NOT NULL,
  `hashrate` double NOT NULL,
  `in_hashrate_ratio` double NOT NULL,
  PRIMARY KEY (`id`),
  unique(`date`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;
