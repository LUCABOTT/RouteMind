
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'evidencias_entrega',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },

          pedido_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'pedidos',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },

          recorrido_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'recorridos',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },

          parada_recorrido_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'paradas_recorrido',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },

          conductor_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'conductores',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },

          public_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true,
          },

          url: {
            type: Sequelize.TEXT,
            allowNull: false,
          },

          formato: {
            type: Sequelize.STRING(10),
            allowNull: false,
          },

          tamano_bytes: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },

          latitud: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },

          longitud: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },

          observaciones: {
            type: Sequelize.TEXT,
            allowNull: true,
          },

          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },

          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'evidencias_entrega',
        ['pedido_id', 'created_at'],
        { transaction },
      );

      await queryInterface.addIndex(
        'evidencias_entrega',
        ['recorrido_id'],
        { transaction },
      );

      await queryInterface.addIndex(
        'evidencias_entrega',
        ['conductor_id'],
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('evidencias_entrega', {
        transaction,
      });
    });
  },
};
